'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from './button'
import { NotificationBell } from './notifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { User, Settings, LogOut, Calendar, Store, BarChart3, Gift, Building2 } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getUserLinks = () => {
    if (!session?.user) return []

    const baseLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    ]

    if (session.user.role === 'ADMIN') {
      return [
        ...baseLinks,
        { href: '/admin', label: 'Administração', icon: Settings },
        { href: '/notifications', label: 'Notificações', icon: User },
      ]
    }

    if (session.user.role === 'STORE_OWNER') {
      return [
        ...baseLinks,
        { href: '/companies', label: 'Empresas', icon: Building2 },
        { href: '/dashboard/appointments', label: 'Agendamentos', icon: Calendar },
        { href: '/reports', label: 'Relatórios', icon: BarChart3 },
        { href: '/coupons', label: 'Cupons', icon: Gift },
        { href: '/notifications', label: 'Notificações', icon: User },
      ]
    }

    return [
      { href: '/client', label: 'Meus Agendamentos', icon: Calendar },
      { href: '/notifications', label: 'Notificações', icon: User },
    ]
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Agendalá
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="/stores" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 relative group">
            Lojas
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-200 group-hover:w-full"></span>
          </Link>
          <Link href="/plans" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 relative group">
            Planos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-200 group-hover:w-full"></span>
          </Link>
          {session?.user && (
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-105 relative group">
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-200 group-hover:w-full"></span>
            </Link>
          )}
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {session?.user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.avatar || ''} alt={session.user.name || ''} />
                      <AvatarFallback>
                        {getInitials(session.user.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {getUserLinks().map((link) => {
                    const Icon = link.icon
                    return (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href} className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Button variant="ghost" asChild className="hidden sm:inline-flex hover:bg-accent/50 transition-all duration-200">
                <Link href="/auth/signin">Entrar</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                <Link href="/auth/signin">Cadastrar</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}