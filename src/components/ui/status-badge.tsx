import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig = {
  PENDING: {
    label: "Pendente",
    className: "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-yellow-700 border border-yellow-300/30"
  },
  CONFIRMED: {
    label: "Confirmado", 
    className: "bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30"
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-gradient-to-r from-red-400/20 to-pink-400/20 text-red-700 border border-red-300/30"
  },
  COMPLETED: {
    label: "Concluído",
    className: "bg-gradient-to-r from-green-400/20 to-emerald-400/20 text-green-700 border border-green-300/30"
  },
  NO_SHOW: {
    label: "Não Compareceu",
    className: "bg-gradient-to-r from-gray-400/20 to-slate-400/20 text-gray-700 border border-gray-300/30"
  }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}