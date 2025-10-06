import { Button } from "@/components/ui/button"
import { ArrowLeft, LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  backHref,
  backLabel = "Voltar",
  actions,
  className
}: PageHeaderProps) {
  return (
    <header className={cn(
      "bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            {backHref && (
              <Link href={backHref}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mr-4 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {backLabel}
                </Button>
              </Link>
            )}
            <div className="flex items-center">
              {Icon && (
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  {title}
                </h1>
                {description && (
                  <p className="text-white/60 text-sm">{description}</p>
                )}
              </div>
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}