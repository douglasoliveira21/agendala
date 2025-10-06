"use client"

import { SessionProvider } from "next-auth/react"

interface SessionProviderWrapperProps {
  children: React.ReactNode
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return (
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  )
}