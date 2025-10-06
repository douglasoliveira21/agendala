'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Key, Plus, Eye, EyeOff, Trash2, Calendar, Activity, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ApiKey {
  id: string
  name: string
  prefix: string
  permissions: any
  active: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  rateLimit: number
  createdAt: string
  _count: {
    usageLogs: number
  }
}

interface CreateApiKeyData {
  name: string
  permissions: any
  expiresAt?: string
  rateLimit: number
}

export default function ApiKeysPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    permissions: {
      appointments: ['read'],
      clients: ['read'],
      services: ['read']
    },
    rateLimit: 1000
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys)
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar API Keys',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar API Keys',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da API Key é obrigatório',
        variant: 'destructive'
      })
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setNewApiKey(data.key)
        setApiKeys(prev => [data.apiKey, ...prev])
        setFormData({
          name: '',
          permissions: {
            appointments: ['read'],
            clients: ['read'],
            services: ['read']
          },
          rateLimit: 1000
        })
        toast({
          title: 'Sucesso',
          description: 'API Key criada com sucesso'
        })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao criar API Key',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar API Key',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setApiKeys(prev => prev.filter(key => key.id !== keyId))
        toast({
          title: 'Sucesso',
          description: 'API Key deletada com sucesso'
        })
      } else {
        toast({
          title: 'Erro',
          description: 'Erro ao deletar API Key',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao deletar API Key',
        variant: 'destructive'
      })
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(null), 2000)
      toast({
        title: 'Copiado!',
        description: 'API Key copiada para a área de transferência'
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar API Key',
        variant: 'destructive'
      })
    }
  }

  const updatePermission = (resource: string, action: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: checked 
          ? [...(prev.permissions[resource] || []), action]
          : (prev.permissions[resource] || []).filter((a: string) => a !== action)
      }
    }))
  }

  const getPermissionBadges = (permissions: any) => {
    const badges = []
    for (const [resource, actions] of Object.entries(permissions)) {
      if (Array.isArray(actions) && actions.length > 0) {
        badges.push(
          <Badge key={resource} variant="secondary" className="text-xs">
            {resource}: {(actions as string[]).join(', ')}
          </Badge>
        )
      }
    }
    return badges
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-600">Gerencie suas chaves de API para integração com terceiros</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Configure as permissões e limitações para sua nova API Key
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da API Key</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Integração CRM"
                />
              </div>

              <div>
                <Label htmlFor="rateLimit">Limite de Requisições por Hora</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={formData.rateLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, rateLimit: parseInt(e.target.value) || 1000 }))}
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <Label htmlFor="expiresAt">Data de Expiração (Opcional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value || undefined }))}
                />
              </div>

              <div>
                <Label>Permissões</Label>
                <div className="space-y-3 mt-2">
                  {['appointments', 'clients', 'services'].map(resource => (
                    <div key={resource} className="border rounded-lg p-3">
                      <h4 className="font-medium capitalize mb-2">{resource}</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {['read', 'create', 'update', 'delete'].map(action => (
                          <label key={action} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={(formData.permissions[resource] || []).includes(action)}
                              onChange={(e) => updatePermission(resource, action, e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-sm capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={createApiKey} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar API Key'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New API Key Display */}
      {newApiKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">API Key Criada com Sucesso!</CardTitle>
            <CardDescription className="text-green-700">
              Copie sua API Key agora. Por segurança, ela não será exibida novamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 p-3 bg-white rounded border">
              <code className="flex-1 text-sm font-mono">{newApiKey}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(newApiKey, 'new')}
              >
                {copiedKey === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => setNewApiKey(null)}
            >
              Entendi, fechar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="grid gap-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma API Key encontrada</h3>
              <p className="text-gray-600 text-center mb-6">
                Crie sua primeira API Key para começar a integrar com sistemas terceiros
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{apiKey.name}</span>
                      <Badge variant={apiKey.active ? "default" : "secondary"}>
                        {apiKey.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      <code className="text-xs">{apiKey.prefix}</code>
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Activity className="w-4 h-4 mr-1" />
                      Logs ({apiKey._count.usageLogs})
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar API Key</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar esta API Key? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Permissões:</h4>
                    <div className="flex flex-wrap gap-1">
                      {getPermissionBadges(apiKey.permissions)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Rate Limit:</span>
                      <div className="font-medium">{apiKey.rateLimit}/hora</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Último Uso:</span>
                      <div className="font-medium">
                        {apiKey.lastUsedAt 
                          ? format(new Date(apiKey.lastUsedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Nunca'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Expira em:</span>
                      <div className="font-medium">
                        {apiKey.expiresAt 
                          ? format(new Date(apiKey.expiresAt), 'dd/MM/yyyy', { locale: ptBR })
                          : 'Nunca'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Criada em:</span>
                      <div className="font-medium">
                        {format(new Date(apiKey.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}