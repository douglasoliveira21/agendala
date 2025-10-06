import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger, measurePerformance } from '@/lib/logger'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  logger.apiRequest('POST', '/api/payments/webhook', undefined, clientIp, { hasSignature: !!signature })

  if (!signature) {
    const duration = Date.now() - startTime
    logger.securityEvent('webhook_no_signature', '/api/payments/webhook', 'Webhook sem assinatura', clientIp)
    logger.apiResponse('POST', '/api/payments/webhook', 400, duration)
    
    return NextResponse.json(
      { error: 'Assinatura do webhook não encontrada' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = await measurePerformance('verify_webhook_signature', () =>
      stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logger.securityEvent('webhook_invalid_signature', '/api/payments/webhook', 'Assinatura de webhook inválida', clientIp)
    logger.apiError('POST', '/api/payments/webhook', error as Error, undefined)
    logger.apiResponse('POST', '/api/payments/webhook', 400, duration)
    
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await measurePerformance('handle_checkout_completed', () =>
          handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        )
        break

      case 'payment_intent.succeeded':
        await measurePerformance('handle_payment_succeeded', () =>
          handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        )
        break

      case 'payment_intent.payment_failed':
        await measurePerformance('handle_payment_failed', () =>
          handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        )
        break

      case 'invoice.payment_succeeded':
        await measurePerformance('handle_subscription_payment', () =>
          handleSubscriptionPayment(event.data.object as Stripe.Invoice)
        )
        break

      case 'customer.subscription.deleted':
        await measurePerformance('handle_subscription_canceled', () =>
          handleSubscriptionCanceled(event.data.object as Stripe.Subscription)
        )
        break

      default:
        logger.apiRequest('POST', '/api/payments/webhook', undefined, clientIp, { eventType: event.type, message: 'Evento não tratado' })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/payments/webhook', 200, duration)

    return NextResponse.json({ received: true })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('POST', '/api/payments/webhook', error as Error, undefined)
    logger.apiResponse('POST', '/api/payments/webhook', 500, duration)
    
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: session.id },
  })

  if (!payment) {
    console.error('Pagamento não encontrado para sessão:', session.id)
    return
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      stripePaymentId: session.payment_intent as string,
      paymentMethod: session.payment_method_types?.[0] || 'card',
      gatewayResponse: session as any,
    },
  })

  // Se for um agendamento, confirmar o agendamento
  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: 'CONFIRMED' },
    })
  }

  // Se for uma assinatura, ativar o plano
  const metadata = payment.metadata as any
  if (metadata?.planId && metadata?.storeId) {
    const plan = await prisma.plan.findUnique({
      where: { id: metadata.planId },
    })

    if (plan) {
      const endDate = new Date()
      if (plan.interval === 'month') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else if (plan.interval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }

      const storePlan = await prisma.storePlan.create({
        data: {
          storeId: metadata.storeId,
          planId: metadata.planId,
          endDate,
        },
      })

      if (session.subscription) {
        await prisma.subscription.create({
          data: {
            storePlanId: storePlan.id,
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
            currentPeriodStart: new Date(),
            currentPeriodEnd: endDate,
          },
        })
      }
    }
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentId: paymentIntent.id },
    data: {
      status: 'COMPLETED',
      gatewayResponse: paymentIntent as any,
    },
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentId: paymentIntent.id },
    data: {
      status: 'FAILED',
      gatewayResponse: paymentIntent as any,
    },
  })
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    })

    if (subscription) {
      await prisma.payment.create({
        data: {
          amount: (invoice.amount_paid || 0) / 100,
          currency: 'BRL',
          status: 'COMPLETED',
          description: 'Pagamento de assinatura',
          subscriptionId: subscription.id,
          gatewayResponse: invoice as any,
        },
      })
    }
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
      canceledAt: new Date(),
    },
  })
}