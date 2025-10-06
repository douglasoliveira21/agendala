"use client"

import { useState, useEffect } from "react"
import { Star, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
}

interface ReviewStats {
  average: number
  total: number
  distribution: Array<{
    rating: number
    count: number
  }>
}

interface ReviewDisplayProps {
  storeId: string
}

export function ReviewDisplay({ storeId }: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchReviews(1)
  }, [storeId])

  const fetchReviews = async (pageNum: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews?storeId=${storeId}&page=${pageNum}&limit=5`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar avaliações')
      }

      const data = await response.json()
      
      if (pageNum === 1) {
        setReviews(data.reviews)
        setStats(data.stats)
      } else {
        setReviews(prev => [...prev, ...data.reviews])
      }
      
      setHasMore(data.pagination.page < data.pagination.pages)
      setPage(pageNum)
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchReviews(page + 1)
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4", 
      lg: "w-5 h-5"
    }

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && page === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avaliações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumo das avaliações */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{(stats.average && !isNaN(stats.average) ? stats.average : 0).toFixed(1)}</div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.average), "lg")}
                </div>
                <div className="text-sm text-gray-600">
                  {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}
                </div>
              </div>
            </div>

            {/* Distribuição das avaliações */}
            <div className="space-y-2">
              {stats.distribution.reverse().map((item) => (
                <div key={item.rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{item.rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <Progress 
                    value={stats.total > 0 ? (item.count / stats.total) * 100 : 0} 
                    className="flex-1 h-2"
                  />
                  <span className="w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de avaliações */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Ainda não há avaliações para esta loja.</p>
              <p className="text-sm">Seja o primeiro a avaliar!</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.user.avatar} />
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{review.user.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    
                    {review.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão carregar mais */}
        {hasMore && reviews.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Carregar mais avaliações'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}