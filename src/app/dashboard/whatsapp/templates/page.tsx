'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MessageSquare, Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface WhatsAppTemplate {
  id: string
  name: string
  type: 'CONFIRMATION' | 'REMINDER' | 'CANCELLATION' | 'CUSTOM'
  template: string
  createdAt: string
  updatedAt: string
}

export default function WhatsAppTemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [storeId, setStoreId] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'CUSTOM' as const,
    template: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'STORE_OWNER') {
      router.push('/dashboard')
      return
    }

    loadStoreAndTemplates()
  }, [session, status, router])

  const loadStoreAndTemplates = async () => {
    try {
      setLoading(true)
      
      // Buscar primeira loja do usuário
      const storesResponse = await fetch('/api/stores?myStores=true')
      const storesData = await storesResponse.json()
      
      if (!storesData.stores || storesData.stores.length === 0) {
        setLoading(false)
        return
      }

      const currentStoreId = storesData.stores[0].id
      setStoreId(currentStoreId)

      // Carregar templates
      const templatesResponse = await fetch(`/api/whatsapp/templates?storeId=${currentStoreId}`)
      const templatesData = await templatesResponse.json()

      if (templatesResponse.ok) {
        setTemplates(templatesData.templates || [])
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.name.trim() || !formData.template.trim()) {
      alert('Nome e template são obrigatórios')
      return
    }

    try {
      setSaving(true)

      const url = editingTemplate 
        ? `/api/whatsapp/templates?storeId=${storeId}`
        : `/api/whatsapp/templates?storeId=${storeId}`

      const method = editingTemplate ? 'PUT' : 'POST'

      const body = editingTemplate 
        ? { ...formData, id: editingTemplate.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        await loadStoreAndTemplates()
        setIsDialogOpen(false)
        resetForm()
      } else {
        alert(data.error || 'Erro ao salvar template')
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/templates?storeId=${storeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: templateId })
      })

      const data = await response.json()

      if (response.ok) {
        await loadStoreAndTemplates()
      } else {
        alert(data.error || 'Erro ao excluir template')
      }
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleEditTemplate = (template: WhatsAppTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      type: template.type,
      template: template.template
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      type: 'CUSTOM',
      template: ''
    })
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      CONFIRMATION: 'Confirmação',
      REMINDER: 'Lembrete',
      CANCELLATION: 'Cancelamento',
      CUSTOM: 'Personalizado'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeBadgeVariant = (type: string) => {
    const variants = {
      CONFIRMATION: 'default',
      REMINDER: 'secondary',
      CANCELLATION: 'destructive',
      CUSTOM: 'outline'
    }
    return variants[type as keyof typeof variants] || 'outline'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Mensagens</h1>
          <p className="text-muted-foreground">
            Gerencie os templates de mensagens automáticas do WhatsApp
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? 'Edite as informações do template de mensagem'
                  : 'Crie um novo template de mensagem para o WhatsApp'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Confirmação Personalizada"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONFIRMATION">Confirmação</SelectItem>
                      <SelectItem value="REMINDER">Lembrete</SelectItem>
                      <SelectItem value="CANCELLATION">Cancelamento</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Template da Mensagem</Label>
                <Textarea
                  id="template"
                  value={formData.template}
                  onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                  placeholder="Digite o template da mensagem..."
                  rows={6}
                />
                <div className="text-sm text-muted-foreground">
                  <p>Variáveis disponíveis:</p>
                  <p>• {'{clientName}'} - Nome do cliente</p>
                  <p>• {'{serviceName}'} - Nome do serviço</p>
                  <p>• {'{date}'} - Data do agendamento</p>
                  <p>• {'{time}'} - Horário do agendamento</p>
                  <p>• {'{storeName}'} - Nome da loja</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Crie seu primeiro template de mensagem para começar a usar as notificações automáticas
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge variant={getTypeBadgeVariant(template.type) as any}>
                      {getTypeLabel(template.type)}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                  {template.updatedAt !== template.createdAt && (
                    <span> • Atualizado em {new Date(template.updatedAt).toLocaleDateString('pt-BR')}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{template.template}</pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}