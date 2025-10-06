import { prisma } from '@/lib/prisma'
import { CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckoutButton } from '@/components/payments/CheckoutButton'

async function getPlans() {
  return await prisma.plan.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  })
}

export default async function PlansPage() {
  const plans = await getPlans()

  const formatPrice = (price: number) => {
  if (!price || isNaN(price)) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(0)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

  const getIntervalText = (interval: string) => {
    return interval === 'month' ? 'mês' : 'ano'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Escolha seu Plano
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Selecione o plano ideal para o seu negócio
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const features = Array.isArray(plan.features) ? plan.features : []
            const isPopular = index === 1 // Marcar o plano do meio como popular
            
            return (
              <Card key={plan.id} className={`relative ${isPopular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600">/{getIntervalText(plan.interval)}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Limites */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Lojas</span>
                      <span className="font-medium">
                        {plan.maxStores === -1 ? 'Ilimitadas' : plan.maxStores}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Serviços</span>
                      <span className="font-medium">
                        {plan.maxServices === -1 ? 'Ilimitados' : plan.maxServices}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Agendamentos/mês</span>
                      <span className="font-medium">
                        {plan.maxAppointments === -1 ? 'Ilimitados' : plan.maxAppointments}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {features.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Recursos inclusos:</h4>
                      <ul className="space-y-1">
                        {features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="pt-4">
                    <CheckoutButton
                      planId={plan.id}
                      amount={plan.price}
                      description={`Assinatura ${plan.name}`}
                    >
                      Assinar Plano
                    </CheckoutButton>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Todos os planos incluem:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Suporte técnico
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Atualizações automáticas
              </div>
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Backup dos dados
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}