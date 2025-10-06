"use client"

import { Star } from "lucide-react"

interface RatingDisplayProps {
  rating: number
  totalReviews: number
  size?: "sm" | "md" | "lg"
  showCount?: boolean
}

export function RatingDisplay({ 
  rating, 
  totalReviews, 
  size = "md", 
  showCount = true 
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  }

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  }

  if (totalReviews === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400">
        <Star className={`${sizeClasses[size]} text-gray-300`} />
        <span className={`${textSizeClasses[size]}`}>
          Sem avaliações
        </span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center">
        <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
        <span className={`ml-1 font-medium ${textSizeClasses[size]}`}>
          {(rating && !isNaN(rating) ? rating : 0).toFixed(1)}
        </span>
      </span>
      {showCount && (
        <span className={`text-gray-500 ${textSizeClasses[size]}`}>
          ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
        </span>
      )}
    </span>
  )
}