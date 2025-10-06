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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Copy, Calendar, Users, Percent, DollarSign, Gift, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Coupon {
  id: string
  code: string
  name: string
  description?: string
  type: "PERCENTAGE" | "FIXED_AMOUNT"
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usageCount: number
  userUsageLimit?: number
  active: boolean
  startDate: string
  endDate?: string
  _count: {
    usages: number
  }
}

interface Store {
  id: string
  name: string
}

export default function CouponsPage() {
  const { data: session } = useSession()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    value: 0,
    minAmount: "",
    maxDiscount: "",
    usageLimit: "",
    userUsageLimit: "",
    active: true,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: ""
  })

  useEffect(() => {
    fetchStores()
  }, [])

  useEffect(() => {
    if (selectedStore) {
      fetchCoupons()
    }
  }, [selectedStore])

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores?myStores=true")
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        if (data.stores && data.stores.length > 0) {
          setSelectedStore(data.stores[0].id)
        }
      }
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
      toast.error("Erro ao carregar lojas")
    }
  }

  const fetchCoupons = async () => {
    if (!selectedStore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/coupons?storeId=${selectedStore}`)
      if (response.ok) {
        const data = await response.json()
        setCoupons(data)
      } else {
        toast.error("Erro ao carregar cupons")
      }
    } catch (error) {
      console.error("Erro ao buscar cupons:", error)
      toast.error("Erro ao carregar cupons")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStore) {
      toast.error("Selecione uma loja")
      return
    }

    try {
      const payload = {
        ...formData,
        storeId: selectedStore,
        value: Number(formData.value),
        minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
        userUsageLimit: formData.userUsageLimit ? Number(formData.userUsageLimit) : undefined,
        endDate: formData.endDate || undefined
      }

      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons"
      const method = editingCoupon ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success(editingCoupon ? "Cupom atualizado!" : "Cupom criado!")
        setIsDialogOpen(false)
        resetForm()
        fetchCoupons()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar cupom")
      }
    } catch (error) {
      console.error("Erro ao salvar cupom:", error)
      toast.error("Erro ao salvar cupom")
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount?.toString() || "",
      maxDiscount: coupon.maxDiscount?.toString() || "",
      usageLimit: coupon.usageLimit?.toString() || "",
      userUsageLimit: coupon.userUsageLimit?.toString() || "",
      active: coupon.active,
      startDate: new Date(coupon.startDate).toISOString().slice(0, 16),
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : ""
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm("Tem certeza que deseja deletar este cupom?")) return

    try {
      const response = await fetch(`/api/coupons/${couponId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Cupom deletado!")
        fetchCoupons()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao deletar cupom")
      }
    } catch (error) {
      console.error("Erro ao deletar cupom:", error)
      toast.error("Erro ao deletar cupom")
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success("Código copiado!")
  }

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "PERCENTAGE",
      value: 0,
      minAmount: "",
      maxDiscount: "",
      usageLimit: "",
      userUsageLimit: "",
      active: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: ""
    })
    setEditingCoupon(null)
  }

  const formatValue = (coupon: Coupon) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}%`
    }
    return `R$ ${(coupon.value && !isNaN(coupon.value) ? coupon.value : 0).toFixed(2)}`
  }

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.startDate)
    const endDate = coupon.endDate ? new Date(coupon.endDate) : null

    if (!coupon.active) {
      return <Badge variant="secondary">Inativo</Badge>
    }

    if (startDate > now) {
      return <Badge variant="outline">Agendado</Badge>
    }

    if (endDate && endDate < now) {
      return <Badge variant="destructive">Expirado</Badge>
    }

    if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
      return <Badge variant="destructive">Esgotado</Badge>
    }

    return <Badge variant="default">Ativo</Badge>
  }

  const activeCoupons = coupons.filter(c => c.active && (!c.endDate || new Date(c.endDate) > new Date()))
  const inactiveCoupons = coupons.filter(c => !c.active || (c.endDate && new Date(c.endDate) <= new Date()))

  const totalUsages = coupons.reduce((sum, coupon) => sum + coupon._count.usages, 0)
  const totalSavings = coupons.reduce((sum, coupon) => {
    // Estimativa baseada no valor médio de uso
    const avgSaving = coupon.type === "PERCENTAGE" ? 50 : coupon.value
    return sum + (coupon._count.usages * avgSaving)
  }, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cupons e Promoções</h1>
          <p className="text-muted-foreground">Gerencie cupons de desconto para sua loja</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}</DialogTitle>
              <DialogDescription>
                Configure os detalhes do cupom de desconto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Código do Cupom</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="DESCONTO10"
                    required
                    disabled={!!editingCoupon}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Desconto de 10%"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do cupom"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo de Desconto</Label>
                  <Select value={formData.type} onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">Valor do Desconto</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.type === "PERCENTAGE" ? "100" : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minAmount">Valor Mínimo (R$)</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
                {formData.type === "PERCENTAGE" && (
                  <div>
                    <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      placeholder="Opcional"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Limite Total de Uso</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
                <div>
                  <Label htmlFor="userUsageLimit">Limite por Usuário</Label>
                  <Input
                    id="userUsageLimit"
                    type="number"
                    min="1"
                    value={formData.userUsageLimit}
                    onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Fim</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Cupom ativo</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCoupon ? "Atualizar" : "Criar"} Cupom
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seletor de Loja */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma loja" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cupons</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCoupons.length} ativos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsages}</div>
            <p className="text-xs text-muted-foreground">
              Cupons utilizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Estimada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(totalSavings && !isNaN(totalSavings) ? totalSavings : 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor economizado pelos clientes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.length > 0 ? (((totalUsages / coupons.length) * 100) && !isNaN((totalUsages / coupons.length) * 100) ? ((totalUsages / coupons.length) * 100) : 0).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de utilização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cupons */}
      <Card>
        <CardHeader>
          <CardTitle>Cupons</CardTitle>
          <CardDescription>
            Gerencie todos os cupons de desconto da loja selecionada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Ativos ({activeCoupons.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inativos ({inactiveCoupons.length})</TabsTrigger>
              <TabsTrigger value="all">Todos ({coupons.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Carregando cupons...</div>
              ) : activeCoupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cupom ativo encontrado
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeCoupons.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCopyCode={copyCode}
                      formatValue={formatValue}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Carregando cupons...</div>
              ) : inactiveCoupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cupom inativo encontrado
                </div>
              ) : (
                <div className="grid gap-4">
                  {inactiveCoupons.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCopyCode={copyCode}
                      formatValue={formatValue}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Carregando cupons...</div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cupom encontrado
                </div>
              ) : (
                <div className="grid gap-4">
                  {coupons.map((coupon) => (
                    <CouponCard
                      key={coupon.id}
                      coupon={coupon}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onCopyCode={copyCode}
                      formatValue={formatValue}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface CouponCardProps {
  coupon: Coupon
  onEdit: (coupon: Coupon) => void
  onDelete: (couponId: string) => void
  onCopyCode: (code: string) => void
  formatValue: (coupon: Coupon) => string
  getStatusBadge: (coupon: Coupon) => React.ReactNode
}

function CouponCard({ coupon, onEdit, onDelete, onCopyCode, formatValue, getStatusBadge }: CouponCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{coupon.name}</h3>
              {getStatusBadge(coupon)}
            </div>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                {coupon.code}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyCode(coupon.code)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {coupon.description && (
              <p className="text-sm text-muted-foreground">{coupon.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {coupon.type === "PERCENTAGE" ? (
                  <Percent className="h-3 w-3" />
                ) : (
                  <DollarSign className="h-3 w-3" />
                )}
                <span>{formatValue(coupon)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{coupon._count.usages} usos</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(coupon.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  {coupon.endDate && ` - ${format(new Date(coupon.endDate), "dd/MM/yyyy", { locale: ptBR })}`}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(coupon)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(coupon.id)}
              disabled={coupon._count.usages > 0}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}