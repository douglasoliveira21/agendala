import React from 'react'
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl"
  text?: string
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-20 w-20"
}

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-xl"
}

export function Loading({ 
  size = "md", 
  text = "Carregando...", 
  className,
  fullScreen = false 
}: LoadingProps) {
  const containerClasses = fullScreen 
    ? "min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center"
    : "flex items-center justify-center p-8"

  return (
    <div className={cn(containerClasses, className)}>
      <div className="text-center">
        <div className="relative">
          {/* Spinner principal com gradiente salmão */}
          <div className={cn(
            "animate-spin rounded-full border-4 border-transparent border-t-primary border-r-accent",
            sizeClasses[size]
          )}></div>
          
          {/* Spinner secundário com animação reversa */}
          <div className={cn(
            "absolute inset-0 animate-spin rounded-full border-4 border-transparent border-b-primary/60 border-l-accent/60",
            sizeClasses[size]
          )} style={{ 
            animationDirection: 'reverse', 
            animationDuration: '1.5s' 
          }}></div>
          
          {/* Ponto central com pulsação */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {text && (
          <p className={cn(
            "mt-6 text-muted-foreground font-medium animate-pulse",
            textSizeClasses[size]
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Componente específico para loading de página completa
export function PageLoading({ text = "Carregando página..." }: { text?: string }) {
  return (
    <Loading 
      size="lg" 
      text={text} 
      fullScreen 
      className="bg-gradient-to-br from-background via-muted/20 to-background"
    />
  )
}

// Componente para loading inline/pequeno
export function InlineLoading({ text, size = "sm" }: { text?: string; size?: "sm" | "md" }) {
  return (
    <Loading 
      size={size} 
      text={text} 
      className="py-4"
    />
  )
}

// Componente para loading de botão
export function ButtonLoading({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-transparent border-t-current",
      sizeClasses[size]
    )}></div>
  )
}