'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Loader2 } from 'lucide-react'

interface CheckoutButtonProps {
  appointmentId?: string
  planId?: string
  storeId?: string
  amount: number
  description: string
  onSuccess?: () => void
  children?: React.ReactNode
}

export function CheckoutButton({
  appointmentId,
  planId,
  storeId,
  amount,
  description,
  onSuccess,
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          planId,
          storeId,
          amount,
          description,
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de checkout')
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de checkout não recebida')
      }
    } catch (error) {
      console.error('Erro no checkout:', error)
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className="w-full"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          {children || `Pagar R$ ${(amount && !isNaN(amount) ? amount : 0).toFixed(2)}`}
        </>
      )}
    </Button>
  )
}