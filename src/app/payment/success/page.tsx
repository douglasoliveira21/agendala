import { Suspense } from 'react'
import { CheckCircle, ArrowLeft, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

interface PaymentSuccessPageProps {
  searchParams: {
    session_id?: string
  }
}

async function PaymentDetails({ sessionId }: { sessionId: string }) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const payment = await prisma.payment.findFirst({
      where: { stripeSessionId: sessionId },
      include: {
        appointment: {
          include: {
            service: true,
            store: true,
          },
        },
      },
    })

    if (!payment) {
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Pagamento não encontrado</CardTitle>
            <CardDescription>
              Não foi possível encontrar os detalhes do pagamento.
            </CardDescription>
          </CardHeader>
        </Card>
      )
    }

    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Seu pagamento foi processado com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>Valor pago: R$ {(payment.amount && !isNaN(payment.amount) ? payment.amount : 0).toFixed(2)}</span>
            </div>
            
            {payment.appointment && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {payment.appointment.service.name} - {payment.appointment.store.name}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 space-y-2">
            {payment.appointment ? (
              <Button asChild className="w-full">
                <Link href="/dashboard/appointments">
                  Ver meus agendamentos
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Ir para o dashboard
                </Link>
              </Button>
            )}
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error('Erro ao buscar detalhes do pagamento:', error)
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Erro</CardTitle>
          <CardDescription>
            Ocorreu um erro ao verificar o pagamento.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
}

export default function PaymentSuccessPage({ searchParams }: PaymentSuccessPageProps) {
  const sessionId = searchParams.session_id

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Sessão inválida</CardTitle>
            <CardDescription>
              ID da sessão de pagamento não encontrado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Verificando pagamento...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <PaymentDetails sessionId={sessionId} />
      </Suspense>
    </div>
  )
}