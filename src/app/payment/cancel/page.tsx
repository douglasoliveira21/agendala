import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Pagamento Cancelado</CardTitle>
          <CardDescription>
            O pagamento foi cancelado. Nenhuma cobrança foi realizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Você pode tentar novamente a qualquer momento ou escolher outro método de pagamento.
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={() => window.history.back()} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao início
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}