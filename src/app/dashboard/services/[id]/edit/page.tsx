"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  active: boolean
  _count?: {
    appointments: number
  }
}

interface FormData {
  name: string
  description: string
  duration: number
  price: number
  active: boolean
}

interface FormErrors {
  name?: string
  duration?: string
  price?: string
  general?: string
}

export default function EditServicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  
  // Estados principais
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    active: true
  })
  
  // Estados de erro e validação
  const [errors, setErrors] = useState<FormErrors>({})
  const [hasChanges, setHasChanges] = useState(false)

  // Efeito principal para carregar dados
  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    loadData()
  }, [session, status, router, params.id])

  // Função para carregar todos os dados necessários
  const loadData = async () => {
    setLoading(true)
    setErrors({})
    
    try {
      await fetchService()
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      setErrors({ general: "Erro ao carregar dados da página" })
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados do serviço
  const fetchService = async () => {
    try {
      const response = await fetch(`/api/dashboard/services/${params.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const serviceData = data.service

      setService(serviceData)
      setFormData({
        name: serviceData.name || "",
        description: serviceData.description || "",
        duration: serviceData.duration || 60,
        price: serviceData.price || 0,
        active: serviceData.active ?? true
      })
      
    } catch (error) {
      console.error("Erro ao carregar serviço:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar serviço"
      setErrors({ general: errorMessage })
      toast.error(errorMessage)
    }
  }



  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = "Nome do serviço é obrigatório"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres"
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Nome deve ter no máximo 100 caracteres"
    }

    // Validar duração
    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = "Duração deve ser maior que zero"
    } else if (formData.duration > 1440) { // 24 horas
      newErrors.duration = "Duração não pode ser maior que 24 horas (1440 minutos)"
    }

    // Validar preço
    if (formData.price < 0) {
      newErrors.price = "Preço não pode ser negativo"
    } else if (formData.price > 999999.99) {
      newErrors.price = "Preço muito alto"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manipular mudanças no formulário
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Verificar se houve mudanças
      if (service) {
        const hasChanged = 
          newData.name !== (service.name || "") ||
          newData.description !== (service.description || "") ||
          newData.duration !== (service.duration || 60) ||
          newData.price !== (service.price || 0) ||
          newData.active !== (service.active ?? true)
        
        setHasChanges(hasChanged)
      }
      
      return newData
    })

    // Limpar erro específico do campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Por favor, corrija os erros no formulário")
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const response = await fetch(`/api/dashboard/services/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          duration: formData.duration,
          price: formData.price,
          active: formData.active
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      toast.success("Serviço atualizado com sucesso!")
      setHasChanges(false)
      
      // Atualizar dados locais
      if (result.service) {
        setService(result.service)
      }
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        router.push("/dashboard/services")
      }, 1500)

    } catch (error) {
      console.error("Erro ao atualizar serviço:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar serviço"
      setErrors({ general: errorMessage })
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // Cancelar edição
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm("Você tem alterações não salvas. Deseja realmente sair?")) {
        router.push("/dashboard/services")
      }
    } else {
      router.push("/dashboard/services")
    }
  }

  // Loading state
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dados do serviço...</p>
        </div>
      </div>
    )
  }

  // Verificação de autenticação
  if (!session || session.user?.role !== "STORE_OWNER") {
    return null
  }

  // Estado de erro geral
  if (errors.general && !service) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/services")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Serviços
          </Button>
          <h1 className="text-3xl font-bold">Editar Serviço</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.general}
          </AlertDescription>
        </Alert>

        <div className="mt-6 space-x-4">
          <Button onClick={loadData} variant="outline">
            <Loader2 className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
          <Button onClick={() => router.push("/dashboard/services")}>
            Voltar para Serviços
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Serviços
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Serviço</h1>
            {service && (
              <p className="text-muted-foreground mt-1">
                {service._count?.appointments ? 
                  `${service._count.appointments} agendamento(s) realizados` : 
                  "Nenhum agendamento ainda"
                }
              </p>
            )}
          </div>
          {hasChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              Alterações não salvas
            </div>
          )}
        </div>
      </div>

      {/* Erro geral */}
      {errors.general && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
            Informações do Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Serviço <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Corte de Cabelo"
                  className={errors.name ? "border-red-500" : ""}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Duração */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duração (minutos) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 0)}
                  placeholder="60"
                  className={errors.duration ? "border-red-500" : ""}
                />
                {errors.duration && (
                  <p className="text-sm text-red-500">{errors.duration}</p>
                )}
              </div>

              {/* Preço */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  Preço (R$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  max="999999.99"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  placeholder="50.00"
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="text-sm text-red-500">{errors.price}</p>
                )}
              </div>


            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição detalhada do serviço..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Status ativo */}
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange("active", checked)}
              />
              <Label htmlFor="active" className="flex items-center">
                Serviço ativo
                {!formData.active && (
                  <span className="ml-2 text-xs text-amber-600">
                    (Serviço não aparecerá para agendamento)
                  </span>
                )}
              </Label>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saving || !hasChanges}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}