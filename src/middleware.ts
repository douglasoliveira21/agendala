import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting store (em produção, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Configurações de rate limiting
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '1000') // Aumentado para 1000
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900000') // 15 minutos

// Função para limpar entradas expiradas do rate limit
function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Rate limiting
function rateLimit(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()
  
  // Limpar entradas expiradas periodicamente
  if (Math.random() < 0.1) { // 10% de chance
    cleanupRateLimit()
  }
  
  const key = `rate_limit:${ip}`
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  current.count++
  return true
}

// Headers de segurança
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevenir clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevenir MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )
  
  // HSTS (apenas em HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Aplicar rate limiting apenas em APIs
  if (pathname.startsWith('/api/')) {
    // Excluir health check e rotas de autenticação do rate limiting
    const excludedPaths = [
      '/api/health', 
      '/api/auth/session', 
      '/api/auth/signin', 
      '/api/auth/signout', 
      '/api/auth/csrf',
      '/api/auth/callback',
      '/api/auth/providers'
    ]
    const shouldApplyRateLimit = !excludedPaths.some(path => pathname.startsWith(path))
    
    if (shouldApplyRateLimit) {
      if (!rateLimit(request)) {
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString(),
            },
          }
        )
      }
    }
  }
  
  // Verificar autenticação para rotas protegidas
  const protectedPaths = ['/dashboard', '/admin', '/reports']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // Verificar se usuário já logado está tentando acessar páginas de auth
  const authPaths = ['/auth/signin', '/auth/signup']
  const isAuthPath = authPaths.includes(pathname)
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  if (isProtectedPath) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  // Redirecionar usuários já logados que tentam acessar páginas de auth
  if (isAuthPath && token) {
    const url = request.nextUrl.clone()
    
    // Redirecionar baseado no role do usuário
    if (token.role === 'ADMIN') {
      url.pathname = '/admin'
    } else if (token.role === 'STORE_OWNER') {
      url.pathname = '/dashboard'
    } else {
      url.pathname = '/client'
    }
    
    return NextResponse.redirect(url)
  }
  
  // Continuar com a requisição
  const response = NextResponse.next()
  
  // Adicionar headers de segurança
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}