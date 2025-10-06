"use client"

import { useState, useEffect } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoading } from "@/components/ui/loading"
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Verificar se o usuário já está logado
  useEffect(() => {
    const checkAuthentication = async () => {
      if (status === "loading") {
        return // Ainda carregando a sessão
      }

      if (status === "authenticated" && session?.user) {
        // Usuário já está logado, redirecionar baseado no role
        const userRole = session.user.role
        
        if (userRole === "ADMIN") {
          router.push("/admin")
        } else if (userRole === "STORE_OWNER") {
          router.push("/dashboard")
        } else {
          router.push("/client")
        }
        return
      }

      // Usuário não está logado, pode mostrar a página de login
      setCheckingAuth(false)
    }

    checkAuthentication()
  }, [session, status, router])

  // Se ainda está verificando a autenticação, mostrar loading
  if (checkingAuth || status === "loading") {
    return <PageLoading text="Verificando autenticação..." />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou senha incorretos")
      } else {
        // Buscar dados da sessão para redirecionar baseado no role
        const session = await getSession()
        
        if (session?.user?.role === "ADMIN") {
          router.push("/admin")
        } else if (session?.user?.role === "STORE_OWNER") {
          router.push("/dashboard")
        } else {
          router.push("/client")
        }
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao início
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Entrar</CardTitle>
            <CardDescription>
              Entre na sua conta para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                  Cadastre-se
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Esqueceu sua senha?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Contas de Demonstração</CardTitle>
            <CardDescription>
              Use estas contas para testar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-gray-700">Administrador:</p>
              <p className="text-gray-600">admin@agendafacil.com / admin123</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Lojista:</p>
              <p className="text-gray-600">loja@agendafacil.com / loja123</p>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">Cliente:</p>
              <p className="text-gray-600">cliente@agendafacil.com / cliente123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}