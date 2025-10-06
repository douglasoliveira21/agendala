import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn(
      "bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl",
      className
    )}>
      <CardContent className="text-center py-12">
        <div className="p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Icon className="h-10 w-10 text-purple-400" />
        </div>
        <h3 className="text-white/80 text-lg font-medium mb-2">{title}</h3>
        {description && (
          <p className="text-white/60 text-sm mb-6">{description}</p>
        )}
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}