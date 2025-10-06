"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowLeft, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Backup {
  id: string
  name: string
  description?: string
  type: "FULL" | "DATA_ONLY" | "SCHEMA_ONLY"
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  size?: number
  filePath?: string
  compressed: boolean
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
}

interface BackupRestore {
  id: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  dropExisting: boolean
  restoreData: boolean
  restoreSchema: boolean
  error?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  backup: {
    id: string
    name: string
    type: string
    description?: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
}

export default function AdminBackupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [backups, setBackups] = useState<Backup[]>([])
  const [restores, setRestores] = useState<BackupRestore[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("backups")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null)

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "FULL" as "FULL" | "DATA_ONLY" | "SCHEMA_ONLY",
    compressed: true
  })

  const [restoreForm, setRestoreForm] = useState({
    backupId: "",
    dropExisting: false,
    restoreData: true,
    restoreSchema: true,
    confirmRestore: false
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchBackups()
    fetchRestores()
  }, [session, status, router])

  const fetchBackups = async () => {
    try {
      const response = await fetch("/api/backups")
      if (response.ok) {
        const data = await response.json()
        setBackups(data.backups)
      }
    } catch (error) {
      console.error("Erro ao carregar backups:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar backups",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRestores = async () => {
    try {
      const response = await fetch("/api/backups/restore")
      if (response.ok) {
        const data = await response.json()
        setRestores(data.restores)
      }
    } catch (error) {
      console.error("Erro ao carregar restaurações:", error)
    }
  }

  const handleCreateBackup = async () => {
    try {
      const response = await fetch("/api/backups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Backup iniciado com sucesso!",
        })
        setIsCreateDialogOpen(false)
        setCreateForm({
          name: "",
          description: "",
          type: "FULL",
          compressed: true
        })
        fetchBackups()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao criar backup",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao criar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar backup",
        variant: "destructive"
      })
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreForm.confirmRestore) {
      toast({
        title: "Erro",
        description: "Você deve confirmar a restauração",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch("/api/backups/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restoreForm),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Restauração iniciada com sucesso!",
        })
        setIsRestoreDialogOpen(false)
        setRestoreForm({
          backupId: "",
          dropExisting: false,
          restoreData: true,
          restoreSchema: true,
          confirmRestore: false
        })
        fetchRestores()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao restaurar backup",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao restaurar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao restaurar backup",
        variant: "destructive"
      })
    }
  }

  const handleDownloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backups/${backupId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `backup-${backupId}.sql`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao baixar backup",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao baixar backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao baixar backup",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("Tem certeza que deseja excluir este backup?")) {
      return
    }

    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Backup excluído com sucesso!",
        })
        fetchBackups()
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao excluir backup",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Erro ao excluir backup:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir backup",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      IN_PROGRESS: { label: "Em Progresso", variant: "default" as const, icon: RefreshCw },
      COMPLETED: { label: "Concluído", variant: "default" as const, icon: CheckCircle },
      FAILED: { label: "Falhou", variant: "destructive" as const, icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: "outline" as const, 
      icon: Clock 
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      FULL: { label: "Completo", variant: "default" as const },
      DATA_ONLY: { label: "Apenas Dados", variant: "secondary" as const },
      SCHEMA_ONLY: { label: "Apenas Estrutura", variant: "outline" as const }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || { 
      label: type, 
      variant: "outline" as const 
    }
    
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando backups...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Backup e Restauração</h1>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Backup
              </Button>
              <Button variant="outline" onClick={() => setIsRestoreDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Restaurar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("backups")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "backups"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Backups ({backups.length})
              </button>
              <button
                onClick={() => setActiveTab("restores")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "restores"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Restaurações ({restores.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Backups Tab */}
        {activeTab === "backups" && (
          <div className="space-y-4">
            {backups.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum backup encontrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crie seu primeiro backup para proteger os dados do sistema
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Backup
                  </Button>
                </CardContent>
              </Card>
            ) : (
              backups.map((backup) => (
                <Card key={backup.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {backup.name}
                          </h3>
                          {getStatusBadge(backup.status)}
                          {getTypeBadge(backup.type)}
                          {backup.compressed && (
                            <Badge variant="outline">Comprimido</Badge>
                          )}
                        </div>
                        
                        {backup.description && (
                          <p className="text-gray-600 mb-3">{backup.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Tamanho:</strong> {formatFileSize(backup.size ? Number(backup.size) : undefined)}
                          </div>
                          <div>
                            <strong>Criado por:</strong> {backup.createdBy.name}
                          </div>
                          <div>
                            <strong>Data:</strong> {new Date(backup.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          {backup.completedAt && (
                            <div>
                              <strong>Concluído:</strong> {new Date(backup.completedAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>

                        {backup.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-red-700 text-sm">{backup.error}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        {backup.status === "COMPLETED" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={backup.status === "IN_PROGRESS"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Restores Tab */}
        {activeTab === "restores" && (
          <div className="space-y-4">
            {restores.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma restauração encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    As restaurações aparecerão aqui quando forem executadas
                  </p>
                </CardContent>
              </Card>
            ) : (
              restores.map((restore) => (
                <Card key={restore.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Restauração: {restore.backup.name}
                          </h3>
                          {getStatusBadge(restore.status)}
                        </div>
                        
                        {restore.backup.description && (
                          <p className="text-gray-600 mb-3">{restore.backup.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <strong>Tipo:</strong> {restore.backup.type}
                          </div>
                          <div>
                            <strong>Executado por:</strong> {restore.createdBy.name}
                          </div>
                          <div>
                            <strong>Data:</strong> {new Date(restore.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          {restore.completedAt && (
                            <div>
                              <strong>Concluído:</strong> {new Date(restore.completedAt).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex space-x-4 text-sm">
                          <span className={restore.restoreData ? "text-green-600" : "text-gray-400"}>
                            {restore.restoreData ? "✓" : "✗"} Dados
                          </span>
                          <span className={restore.restoreSchema ? "text-green-600" : "text-gray-400"}>
                            {restore.restoreSchema ? "✓" : "✗"} Estrutura
                          </span>
                          <span className={restore.dropExisting ? "text-red-600" : "text-gray-400"}>
                            {restore.dropExisting ? "✓" : "✗"} Substituir existente
                          </span>
                        </div>

                        {restore.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                              <span className="text-red-700 text-sm">{restore.error}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Backup Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Backup</DialogTitle>
            <DialogDescription>
              Configure as opções do backup do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-name">Nome do Backup</Label>
              <Input
                id="backup-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ex: Backup diário - 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-description">Descrição (opcional)</Label>
              <Textarea
                id="backup-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Descreva o propósito deste backup..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-type">Tipo de Backup</Label>
              <Select value={createForm.type} onValueChange={(value: "FULL" | "DATA_ONLY" | "SCHEMA_ONLY") => setCreateForm({ ...createForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Completo (dados + estrutura)</SelectItem>
                  <SelectItem value="DATA_ONLY">Apenas dados</SelectItem>
                  <SelectItem value="SCHEMA_ONLY">Apenas estrutura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="compressed"
                checked={createForm.compressed}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, compressed: !!checked })}
              />
              <Label htmlFor="compressed">Comprimir arquivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBackup} disabled={!createForm.name}>
              Criar Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Selecione um backup para restaurar. Esta ação pode sobrescrever dados existentes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-select">Backup para Restaurar</Label>
              <Select value={restoreForm.backupId} onValueChange={(value) => setRestoreForm({ ...restoreForm, backupId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um backup..." />
                </SelectTrigger>
                <SelectContent>
                  {backups.filter(b => b.status === "COMPLETED").map((backup) => (
                    <SelectItem key={backup.id} value={backup.id}>
                      {backup.name} - {new Date(backup.createdAt).toLocaleDateString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>Opções de Restauração</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-data"
                  checked={restoreForm.restoreData}
                  onCheckedChange={(checked) => setRestoreForm({ ...restoreForm, restoreData: !!checked })}
                />
                <Label htmlFor="restore-data">Restaurar dados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restore-schema"
                  checked={restoreForm.restoreSchema}
                  onCheckedChange={(checked) => setRestoreForm({ ...restoreForm, restoreSchema: !!checked })}
                />
                <Label htmlFor="restore-schema">Restaurar estrutura</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="drop-existing"
                  checked={restoreForm.dropExisting}
                  onCheckedChange={(checked) => setRestoreForm({ ...restoreForm, dropExisting: !!checked })}
                />
                <Label htmlFor="drop-existing">Substituir dados existentes</Label>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm font-medium">Atenção!</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                A restauração pode sobrescrever dados existentes. Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center space-x-2 mt-3">
                <Checkbox
                  id="confirm-restore"
                  checked={restoreForm.confirmRestore}
                  onCheckedChange={(checked) => setRestoreForm({ ...restoreForm, confirmRestore: !!checked })}
                />
                <Label htmlFor="confirm-restore" className="text-sm">
                  Eu entendo os riscos e confirmo a restauração
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRestoreBackup} 
              disabled={!restoreForm.backupId || !restoreForm.confirmRestore}
              variant="destructive"
            >
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}