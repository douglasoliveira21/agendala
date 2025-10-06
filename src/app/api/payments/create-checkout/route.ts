import { NextRequest, NextResponse } from 'next/server'
// import { stripe } from '@/lib/stripe'
// import { prisma } from '@/lib/prisma'
// import { z } from 'zod'
// import { logger, measurePerformance } from '@/lib/logger'

// FUNCIONALIDADE DE PAGAMENTO DESABILITADA
// Este sistema é apenas para agendamentos, não requer pagamento

// const createCheckoutSchema = z.object({
//   appointmentId: z.string().optional(),
//   planId: z.string().optional(),
//   storeId: z.string().optional(),
//   amount: z.number().positive(),
//   description: z.string(),
//   successUrl: z.string().url(),
//   cancelUrl: z.string().url(),
// })

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Funcionalidade de pagamento desabilitada. Este sistema é apenas para agendamentos.',
      message: 'Payment functionality disabled. This system is for appointments only.'
    },
    { status: 501 } // Not Implemented
  )
}

// ... existing code commented out ...
// export async function POST(request: NextRequest) {
//   const startTime = Date.now()
//   const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
//   
//   try {
//     const body = await request.json()
//     
//     logger.apiRequest('POST', '/api/payments/create-checkout', undefined, clientIp, body)
//     
//     const { appointmentId, planId, storeId, amount, description, successUrl, cancelUrl } = createCheckoutSchema.parse(body)

//     // Verificar se é para agendamento ou assinatura
//     let appointment = null
//     let store = null

//     if (appointmentId) {
//       appointment = await measurePerformance('fetch_appointment', () =>
//         prisma.appointment.findUnique({
//           where: { id: appointmentId },
//           include: {
//             service: true,
//             store: true,
//           },
//         })
//       )

//       if (!appointment) {
//         const duration = Date.now() - startTime
//         logger.apiResponse('POST', '/api/payments/create-checkout', 404, duration)
//         
//         return NextResponse.json(
//           { error: 'Agendamento não encontrado' },
//           { status: 404 }
//         )
//       }
//     }

//     if (storeId) {
//       store = await measurePerformance('fetch_store', () =>
//         prisma.store.findUnique({
//           where: { id: storeId },
//         })
//       )

//       if (!store) {
//         const duration = Date.now() - startTime
//         logger.apiResponse('POST', '/api/payments/create-checkout', 404, duration)
//         
//         return NextResponse.json(
//           { error: 'Loja não encontrada' },
//           { status: 404 }
//         )
//       }
//     }

//     // Criar sessão de checkout no Stripe
//     const session = await measurePerformance('create_stripe_session', () =>
//       stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         line_items: [
//           {
//             price_data: {
//               currency: 'brl',
//               product_data: {
//                 name: description,
//                 description: appointment 
//                   ? `Agendamento: ${appointment.service.name} - ${appointment.store.name}`
//                   : `Assinatura de plano`,
//               },
//               unit_amount: Math.round(amount * 100), // Stripe usa centavos
//             },
//             quantity: 1,
//           },
//         ],
//         mode: planId ? 'subscription' : 'payment',
//         success_url: successUrl,
//         cancel_url: cancelUrl,
//         metadata: {
//           appointmentId: appointmentId || '',
//           planId: planId || '',
//           storeId: storeId || '',
//         },
//       })
//     )

//     // Criar registro de pagamento no banco
//     const payment = await measurePerformance('create_payment_record', () =>
//       prisma.payment.create({
//         data: {
//           amount,
//           currency: 'BRL',
//           status: 'PENDING',
//           description,
//           stripeSessionId: session.id,
//           appointmentId,
//           metadata: {
//             planId,
//             storeId,
//           },
//         },
//       })
//     )

//     const duration = Date.now() - startTime
//     logger.apiResponse('POST', '/api/payments/create-checkout', 200, duration)

//     return NextResponse.json({
//       sessionId: session.id,
//       paymentId: payment.id,
//       url: session.url,
//     })
//   } catch (error) {
//     const duration = Date.now() - startTime
//     
//     if (error instanceof z.ZodError) {
//       logger.apiResponse('POST', '/api/payments/create-checkout', 400, duration)
//       
//       return NextResponse.json(
//         { error: 'Dados inválidos', details: error.errors },
//         { status: 400 }
//       )
//     }

//     logger.apiError('POST', '/api/payments/create-checkout', error as Error, undefined)
//     logger.apiResponse('POST', '/api/payments/create-checkout', 500, duration)
//     
//     return NextResponse.json(
//       { error: 'Erro interno do servidor' },
//       { status: 500 }
//     )
//   }
// }