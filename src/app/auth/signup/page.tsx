"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoading } from "@/components/ui/loading"
import { Eye, EyeOff, ArrowLeft, Check, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    whatsappCountryCode: "+55",
    whatsappAreaCode: "",
    whatsappNumber: "",
    whatsappFullNumber: "",
    role: "CLIENT" as "CLIENT" | "STORE_OWNER"
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
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

      // Usuário não está logado, pode mostrar a página de cadastro
      setCheckingAuth(false)
    }

    checkAuthentication()
  }, [session, status, router])

  // Se ainda está verificando a autenticação, mostrar loading
  if (checkingAuth || status === "loading") {
    return <PageLoading text="Verificando autenticação..." />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      
      // Atualizar número completo do WhatsApp automaticamente
      if (name === 'whatsappCountryCode' || name === 'whatsappAreaCode' || name === 'whatsappNumber') {
        const countryCode = name === 'whatsappCountryCode' ? value : prev.whatsappCountryCode
        const areaCode = name === 'whatsappAreaCode' ? value : prev.whatsappAreaCode
        const number = name === 'whatsappNumber' ? value : prev.whatsappNumber
        
        newData.whatsappFullNumber = `${countryCode}${areaCode}${number}`
      }
      
      return newData
    })
  }

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError("Todos os campos obrigatórios devem ser preenchidos")
      return false
    }

    if (!formData.whatsappAreaCode || !formData.whatsappNumber) {
      setError("WhatsApp é obrigatório para receber notificações")
      return false
    }

    if (formData.whatsappAreaCode.length !== 2) {
      setError("DDD deve ter 2 dígitos")
      return false
    }

    if (formData.whatsappNumber.length < 8 || formData.whatsappNumber.length > 9) {
      setError("Número do WhatsApp deve ter 8 ou 9 dígitos")
      return false
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Email inválido")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          whatsappCountryCode: formData.whatsappCountryCode,
          whatsappAreaCode: formData.whatsappAreaCode,
          whatsappNumber: formData.whatsappNumber,
          whatsappFullNumber: formData.whatsappFullNumber,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/signin")
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta criada com sucesso!</h2>
            <p className="text-gray-600 mb-4">
              Você será redirecionado para a página de login em alguns segundos.
            </p>
            <Link href="/auth/signin">
              <Button>Ir para Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
            <CardDescription>
              Cadastre-se para começar a usar o AgendaFácil
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
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nome completo *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  WhatsApp * <span className="text-xs text-gray-500">(obrigatório para notificações)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="whatsappCountryCode" className="text-xs text-gray-600">
                      País
                    </label>
                    <select
                      id="whatsappCountryCode"
                      name="whatsappCountryCode"
                      value={formData.whatsappCountryCode}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="whatsappAreaCode" className="text-xs text-gray-600">
                      DDD
                    </label>
                    <Input
                      id="whatsappAreaCode"
                      name="whatsappAreaCode"
                      type="tel"
                      placeholder="11"
                      value={formData.whatsappAreaCode}
                      onChange={handleChange}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="whatsappNumber" className="text-xs text-gray-600">
                      Número
                    </label>
                    <Input
                      id="whatsappNumber"
                      name="whatsappNumber"
                      type="tel"
                      placeholder="999999999"
                      value={formData.whatsappNumber}
                      onChange={handleChange}
                      maxLength={9}
                      required
                    />
                  </div>
                </div>
                {formData.whatsappFullNumber && (
                  <p className="text-xs text-gray-500">
                    Número completo: {formData.whatsappFullNumber}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Tipo de conta *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="CLIENT">Cliente - Quero agendar serviços</option>
                  <option value="STORE_OWNER">Profissional - Quero oferecer serviços</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha *
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirmar senha *
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{" "}
                <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500 font-medium">
                  Faça login
                </Link>
              </p>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <Link href="/termos" className="text-blue-600 hover:text-blue-500">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link href="/privacidade" className="text-blue-600 hover:text-blue-500">
                Política de Privacidade
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}