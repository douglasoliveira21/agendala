"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Package } from "lucide-react"
import { toast } from "sonner"

interface ServiceCategory {
  id: string
  name: string
  description?: string
  color: string
  _count: {
    services: number
  }
}

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  })

  if (status === "loading") {
    return <div>Carregando...</div>
  }

  if (!session || session.user.role !== "STORE_OWNER") {
    redirect("/dashboard")
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/dashboard/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        toast.error("Erro ao carregar categorias")
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
      toast.error("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    try {
      const response = await fetch("/api/dashboard/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Categoria criada com sucesso!")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "", color: "#3B82F6" })
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao criar categoria")
      }
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      toast.error("Erro ao criar categoria")
    }
  }

  const handleEditCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/dashboard/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Categoria atualizada com sucesso!")
        setIsEditDialogOpen(false)
        setEditingCategory(null)
        setFormData({ name: "", description: "", color: "#3B82F6" })
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar categoria")
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      toast.error("Erro ao atualizar categoria")
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) {
      return
    }

    try {
      const response = await fetch(`/api/dashboard/categories/${categoryId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Categoria excluída com sucesso!")
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir categoria")
      }
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast.error("Erro ao excluir categoria")
    }
  }

  const openEditDialog = (category: ServiceCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3B82F6" })
    setEditingCategory(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando categorias...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categorias de Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos seus serviços
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria para organizar seus serviços.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da categoria (opcional)"
                />
              </div>
              <div>
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCategory}>
                Criar Categoria
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não criou nenhuma categoria. Crie sua primeira categoria para organizar seus serviços.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={category._count.services > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <CardDescription className="mb-3">
                    {category.description}
                  </CardDescription>
                )}
                <Badge variant="secondary">
                  {category._count.services} serviço{category._count.services !== 1 ? 's' : ''}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria (opcional)"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Cor</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCategory}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}