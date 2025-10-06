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
import { Switch } from "@/components/ui/switch"
import { Trash2, Edit, Plus, Package, Store, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  slug: string
  active: boolean
  _count: {
    stores: number
  }
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    active: true
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user.role !== "ADMIN") {
      redirect("/admin")
      return
    }
    
    fetchCategories()
  }, [session, status])

  if (status === "loading") {
    return <div>Carregando...</div>
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
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
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Categoria criada com sucesso!")
        setIsCreateDialogOpen(false)
        setFormData({ name: "", description: "", icon: "", active: true })
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
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
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
        setFormData({ name: "", description: "", icon: "", active: true })
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
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
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

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      active: category.active
    })
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    setEditingCategory(null)
    setFormData({ name: "", description: "", icon: "", active: true })
    setIsEditDialogOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando categorias...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as categorias de lojas da plataforma
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
              <DialogDescription>
                Adicione uma nova categoria para organizar as lojas da plataforma.
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
                <Label htmlFor="icon">Ícone</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Emoji ou ícone (opcional)"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Categoria ativa</Label>
              </div>
            </div>
            <DialogFooter>
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
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-600 text-center mb-4">
              Você ainda não criou nenhuma categoria. Crie sua primeira categoria para organizar as lojas da plataforma.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {category.icon && (
                      <span className="text-2xl">{category.icon}</span>
                    )}
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Ativa
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inativa
                        </>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={category._count.stores > 0}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Store className="h-4 w-4 mr-1" />
                  {category._count.stores} loja{category._count.stores !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Slug: {category.slug}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
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
              <Label htmlFor="edit-icon">Ícone</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Emoji ou ícone (opcional)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="edit-active">Categoria ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
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