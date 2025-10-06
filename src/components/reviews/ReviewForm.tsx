"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Star, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ReviewFormProps {
  storeId: string
  onReviewSubmitted?: () => void
}

export function ReviewForm({ storeId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error("Você precisa estar logado para avaliar")
      return
    }

    if (rating === 0) {
      toast.error("Por favor, selecione uma avaliação")
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId,
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar avaliação')
      }

      toast({
        title: "Sucesso!",
        description: "Avaliação enviada com sucesso!"
      })
      
      // Resetar formulário
      setRating(0)
      setComment("")
      
      // Notificar componente pai
      onReviewSubmitted?.()
      
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao enviar avaliação',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-200"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {rating === 1 && "Muito ruim"}
            {rating === 2 && "Ruim"}
            {rating === 3 && "Regular"}
            {rating === 4 && "Bom"}
            {rating === 5 && "Excelente"}
          </span>
        )}
      </div>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliar esta loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Faça login para avaliar esta loja</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliar esta loja</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avaliação por estrelas */}
          <div className="space-y-2">
            <Label>Sua avaliação</Label>
            {renderStars()}
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comentário <span className="text-gray-500">(opcional)</span>
            </Label>
            <Textarea
              id="comment"
              placeholder="Conte sobre sua experiência com esta loja..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {comment.length}/500 caracteres
            </div>
          </div>

          {/* Botão de envio */}
          <Button 
            type="submit" 
            disabled={loading || rating === 0}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar avaliação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}