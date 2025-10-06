import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfoCardProps {
  icon: LucideIcon
  label: string
  value: string | React.ReactNode
  iconColor?: string
  className?: string
  variant?: "default" | "compact"
}

export function InfoCard({
  icon: Icon,
  label,
  value,
  iconColor = "from-primary to-accent",
  className,
  variant = "default"
}: InfoCardProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center text-sm", className)}>
        <div className={cn(
          "p-1.5 rounded-lg mr-3",
          `bg-gradient-to-r ${iconColor}/20`
        )}>
          <Icon className={cn(
            "h-4 w-4",
            iconColor.includes("primary") ? "text-primary" :
            iconColor.includes("purple") ? "text-purple-400" :
            iconColor.includes("green") ? "text-green-400" :
            iconColor.includes("orange") ? "text-orange-400" :
            iconColor.includes("pink") ? "text-pink-400" :
            iconColor.includes("accent") ? "text-accent" :
            "text-primary"
          )} />
        </div>
        <div>
          <span className="font-medium text-white">{value}</span>
          {typeof value === "string" && (
            <p className="text-white/70 text-xs">{label}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      "bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-purple-500/10 hover:border-purple-400/30 transition-all duration-300",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "p-3 rounded-xl",
            `bg-gradient-to-r ${iconColor}`
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white/60 text-sm font-medium">{label}</p>
            <div className="text-white text-lg font-semibold">
              {value}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}