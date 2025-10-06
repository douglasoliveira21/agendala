"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Store {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  categoryId: string | null
  ownerId: string
  active: boolean
  category?: {
    name: string
  }
  owner: {
    name: string
    email: string
  }
}

interface Category {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function EditStorePage() {
  const router = useRouter()
  const params = useParams()
  const storeId = params.id as string

  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [storeOwners, setStoreOwners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    categoryId: "",
    ownerId: "",
    active: true
  })

  useEffect(() => {
    fetchData()
  }, [storeId])

  const fetchData = async () => {
    try {
      // Buscar lojas
      const storesResponse = await fetch(`/api/admin/stores`)
      if (!storesResponse.ok) throw new Error("Erro ao buscar lojas")
      
      const storesData = await storesResponse.json()
      const foundStore = storesData.stores.find((s: Store) => s.id === storeId)
      
      if (!foundStore) {
        toast.error("Loja não encontrada")
        router.push("/admin/stores")
        return
      }

      // Buscar categorias
      const categoriesResponse = await fetch(`/api/dashboard/categories`)
      const categoriesData = await categoriesResponse.json()

      // Buscar usuários lojistas
      const usersResponse = await fetch(`/api/admin/users`)
      const usersData = await usersResponse.json()
      const owners = usersData.users.filter((u: any) => u.role === "STORE_OWNER")

      setStore(foundStore)
      setCategories(categoriesData.categories || [])
      setStoreOwners(owners)
      setFormData({
        name: foundStore.name,
        description: foundStore.description || "",
        address: foundStore.address || "",
        phone: foundStore.phone || "",
        email: foundStore.email || "",
        categoryId: foundStore.categoryId || "",
        ownerId: foundStore.ownerId,
        active: foundStore.active
      })
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      toast.error("Erro ao carregar dados da loja")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/stores`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: storeId,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar loja")
      }

      toast.success("Loja atualizada com sucesso!")
      router.push("/admin/stores")
    } catch (error: any) {
      console.error("Erro ao atualizar loja:", error)
      toast.error(error.message || "Erro ao atualizar loja")
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

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loja não encontrada</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/stores")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Loja</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Informações da Loja</CardTitle>
          <CardDescription>
            Edite as informações da loja {store.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Loja</Label>
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
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerId">Proprietário</Label>
                <Select
                  value={formData.ownerId}
                  onValueChange={(value) => handleInputChange("ownerId", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOwners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name} ({owner.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição da loja..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleInputChange("active", checked)}
              />
              <Label htmlFor="active">Loja ativa</Label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/stores")}
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