"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ServiceCategory {
  id: string
  name: string
}

export default function NewServicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    price: 0,
    active: true,
    categoryId: ""
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "STORE_OWNER") {
      router.push("/auth/signin")
      return
    }

    fetchCategories()
  }, [session, status, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/dashboard/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/dashboard/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          duration: Number(formData.duration),
          price: Number(formData.price)
        })
      })

      if (response.ok) {
        toast.success("Serviço criado com sucesso!")
        router.push("/dashboard/services")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar serviço")
      }
    } catch (error) {
      toast.error("Erro ao criar serviço")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "STORE_OWNER") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard/services")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Novo Serviço</h1>
              <p className="text-gray-600">
                Crie um novo serviço para sua loja
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nome do Serviço</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ex: Corte de Cabelo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    min="0"
                    required
                  />
                </div>
              </div>

              {categories.length > 0 && (
                <div>
                  <Label htmlFor="categoryId">Categoria</Label>
                  <select
                    id="categoryId"
                    value={formData.categoryId}
                    onChange={(e) => handleInputChange("categoryId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleInputChange("active", checked)}
                />
                <Label htmlFor="active">Serviço ativo</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/services")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Serviço
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}