"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: "CLIENT" | "STORE_OWNER" | "ADMIN"
  active: boolean
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CLIENT" as "CLIENT" | "STORE_OWNER" | "ADMIN",
    active: true
  })

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users`)
      if (!response.ok) throw new Error("Erro ao buscar usuários")
      
      const data = await response.json()
      const foundUser = data.users.find((u: User) => u.id === userId)
      
      if (!foundUser) {
        toast.error("Usuário não encontrado")
        router.push("/admin/users")
        return
      }

      setUser(foundUser)
      setFormData({
        name: foundUser.name,
        email: foundUser.email,
        phone: foundUser.phone || "",
        role: foundUser.role,
        active: foundUser.active
      })
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      toast.error("Erro ao carregar dados do usuário")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: userId,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar usuário")
      }

      toast.success("Usuário atualizado com sucesso!")
      router.push("/admin/users")
    } catch (error: any) {
      console.error("Erro ao atualizar usuário:", error)
      toast.error(error.message || "Erro ao atualizar usuário")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Usuário</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Edite as informações do usuário {user.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Papel</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Cliente</SelectItem>
                    <SelectItem value="STORE_OWNER">Lojista</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange("active", checked)}
              />
              <Label htmlFor="active">Usuário ativo</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/users")}
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
                    Salvar
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