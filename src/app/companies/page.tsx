"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Store, 
  Settings, 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  Crown,
  Shield,
  UserCheck,
  User
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Company {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country: string
  timezone: string
  currency: string
  language: string
  primaryColor: string
  secondaryColor: string
  maxStores: number
  maxUsers: number
  active: boolean
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  stores: Array<{
    id: string
    name: string
    active: boolean
  }>
  users: Array<{
    id: string
    role: string
    active: boolean
    user: {
      id: string
      name: string
      email: string
      avatar?: string
    }
  }>
  _count: {
    stores: number
    users: number
  }
}

interface CompanyUser {
  id: string
  role: string
  active: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    createdAt: string
  }
}

const roleLabels = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  MEMBER: 'Membro'
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MANAGER: UserCheck,
  MEMBER: User
}

export default function CompaniesPage() {
  const { data: session } = useSession()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false)
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    website: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "BR",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    language: "pt-BR",
    primaryColor: "#3B82F6",
    secondaryColor: "#1F2937",
    maxStores: 1,
    maxUsers: 5
  })

  const [userFormData, setUserFormData] = useState({
    email: "",
    role: "MEMBER" as "ADMIN" | "MANAGER" | "MEMBER"
  })

  useEffect(() => {
    if (session?.user) {
      fetchCompanies()
    }
  }, [session])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      } else {
        toast.error('Erro ao carregar empresas')
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyUsers = async (companyId: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/users`)
      if (response.ok) {
        const data = await response.json()
        setCompanyUsers(data.users || [])
      } else {
        toast.error('Erro ao carregar usuários da empresa')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error)
      toast.error('Erro ao carregar usuários da empresa')
    }
  }

  const handleCreateCompany = async () => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Empresa criada com sucesso!')
        setIsCreateDialogOpen(false)
        resetForm()
        fetchCompanies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar empresa')
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error)
      toast.error('Erro ao criar empresa')
    }
  }

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Empresa atualizada com sucesso!')
        setIsEditDialogOpen(false)
        setSelectedCompany(null)
        resetForm()
        fetchCompanies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar empresa')
      }
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error)
      toast.error('Erro ao atualizar empresa')
    }
  }

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Empresa excluída com sucesso!')
        fetchCompanies()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir empresa')
      }
    } catch (error) {
      console.error('Erro ao excluir empresa:', error)
      toast.error('Erro ao excluir empresa')
    }
  }

  const handleAddUser = async () => {
    if (!selectedCompany) return

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData),
      })

      if (response.ok) {
        toast.success('Usuário adicionado com sucesso!')
        setIsAddUserDialogOpen(false)
        setUserFormData({ email: "", role: "MEMBER" })
        fetchCompanyUsers(selectedCompany.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar usuário')
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      toast.error('Erro ao adicionar usuário')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!selectedCompany) return

    if (!confirm('Tem certeza que deseja remover este usuário da empresa?')) {
      return
    }

    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuário removido com sucesso!')
        fetchCompanyUsers(selectedCompany.id)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao remover usuário')
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário')
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "BR",
      timezone: "America/Sao_Paulo",
      currency: "BRL",
      language: "pt-BR",
      primaryColor: "#3B82F6",
      secondaryColor: "#1F2937",
      maxStores: 1,
      maxUsers: 5
    })
  }

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company)
    setFormData({
      name: company.name,
      slug: company.slug,
      description: company.description || "",
      logo: company.logo || "",
      website: company.website || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: company.country,
      timezone: company.timezone,
      currency: company.currency,
      language: company.language,
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
      maxStores: company.maxStores,
      maxUsers: company.maxUsers
    })
    setIsEditDialogOpen(true)
  }

  const openUsersDialog = (company: Company) => {
    setSelectedCompany(company)
    setIsUsersDialogOpen(true)
    fetchCompanyUsers(company.id)
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando empresas...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground">Gerencie suas empresas e equipes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Empresa</DialogTitle>
              <DialogDescription>
                Preencha as informações da nova empresa
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="slug-da-empresa"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da empresa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo (URL)</Label>
                    <Input
                      id="logo"
                      value={formData.logo}
                      onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="SP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStores">Máximo de Lojas</Label>
                    <Input
                      id="maxStores"
                      type="number"
                      min="1"
                      value={formData.maxStores}
                      onChange={(e) => setFormData({ ...formData, maxStores: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Máximo de Usuários</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      min="1"
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCompany}>
                Criar Empresa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar empresas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Lista de Empresas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{company.slug}</p>
                  </div>
                </div>
                <Badge variant={company.active ? "default" : "secondary"}>
                  {company.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              {company.description && (
                <CardDescription className="line-clamp-2">
                  {company.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Store className="w-4 h-4 text-muted-foreground" />
                    <span>{company._count.stores} lojas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{company._count.users} usuários</span>
                  </div>
                </div>

                {(company.email || company.phone || company.website) && (
                  <div className="space-y-1">
                    {company.email && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{company.website}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUsersDialog(company)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Usuários
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(company)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                  {company.owner.id === session?.user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCompany(company)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Tente ajustar sua busca" : "Comece criando sua primeira empresa"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Empresa
            </Button>
          )}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>
              Atualize as informações da empresa
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug *</Label>
                  <Input
                    id="edit-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="slug-da-empresa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da empresa"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-logo">Logo (URL)</Label>
                  <Input
                    id="edit-logo"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Endereço</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-city">Cidade</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-state">Estado</Label>
                  <Input
                    id="edit-state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-zipCode">CEP</Label>
                  <Input
                    id="edit-zipCode"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-timezone">Fuso Horário</Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Moeda</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-maxStores">Máximo de Lojas</Label>
                  <Input
                    id="edit-maxStores"
                    type="number"
                    min="1"
                    value={formData.maxStores}
                    onChange={(e) => setFormData({ ...formData, maxStores: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-maxUsers">Máximo de Usuários</Label>
                  <Input
                    id="edit-maxUsers"
                    type="number"
                    min="1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-primaryColor">Cor Primária</Label>
                  <Input
                    id="edit-primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-secondaryColor">Cor Secundária</Label>
                  <Input
                    id="edit-secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateCompany}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Usuários */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usuários da Empresa</DialogTitle>
            <DialogDescription>
              Gerencie os usuários e suas permissões na empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {companyUsers.length} usuários
              </div>
              <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Usuário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Usuário</DialogTitle>
                    <DialogDescription>
                      Adicione um usuário existente à empresa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-email">Email do Usuário</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="usuario@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">Função</Label>
                      <Select value={userFormData.role} onValueChange={(value: "ADMIN" | "MANAGER" | "MEMBER") => setUserFormData({ ...userFormData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="MANAGER">Gerente</SelectItem>
                          <SelectItem value="MEMBER">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddUser}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {companyUsers.map((companyUser) => {
                const RoleIcon = roleIcons[companyUser.role as keyof typeof roleIcons]
                return (
                  <div key={companyUser.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {companyUser.user.avatar ? (
                          <img src={companyUser.user.avatar} alt={companyUser.user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{companyUser.user.name}</div>
                        <div className="text-sm text-muted-foreground">{companyUser.user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="flex items-center space-x-1">
                        <RoleIcon className="w-3 h-3" />
                        <span>{roleLabels[companyUser.role as keyof typeof roleLabels]}</span>
                      </Badge>
                      <Badge variant={companyUser.active ? "default" : "secondary"}>
                        {companyUser.active ? "Ativo" : "Inativo"}
                      </Badge>
                      {companyUser.role !== 'OWNER' && companyUser.user.id !== session?.user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveUser(companyUser.user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUsersDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}