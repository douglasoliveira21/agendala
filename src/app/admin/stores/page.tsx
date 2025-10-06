"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Store, MapPin, Phone, Mail, Calendar, Users } from "lucide-react"
import Link from "next/link"

interface Store {
  id: string
  name: string
  slug: string
  description?: string
  phone?: string
  email?: string
  city?: string
  state?: string
  active: boolean
  createdAt: string
  category: {
    name: string
  }
  owner: {
    name: string
    email: string
  }
  _count: {
    services: number
    appointments: number
  }
}

export default function AdminStoresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchStores()
  }, [session, status, router])

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/admin/stores")
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores)
      }
    } catch (error) {
      console.error("Erro ao carregar lojas:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando lojas...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Store className="h-6 w-6 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-foreground">Gerenciar Lojas</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Lojas</CardTitle>
            <CardDescription>
              Encontre lojas por nome, proprietário ou categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome da loja, proprietário ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stores List */}
        <div className="space-y-4">
          {filteredStores.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "Nenhuma loja encontrada" : "Nenhuma loja cadastrada"}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Tente ajustar os termos de busca" 
                    : "As lojas aparecerão aqui quando forem cadastradas"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredStores.map((store) => (
              <Card key={store.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {store.name}
                        </h3>
                        <Badge variant={store.active ? "default" : "secondary"}>
                          {store.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">
                          {store.category.name}
                        </Badge>
                      </div>
                      
                      {store.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {store.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Proprietário: {store.owner.name}
                        </div>
                        
                        {store.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {store.email}
                          </div>
                        )}
                        
                        {store.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {store.phone}
                          </div>
                        )}
                        
                        {(store.city || store.state) && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {[store.city, store.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Cadastrada em {new Date(store.createdAt).toLocaleDateString('pt-BR')}
                        </div>

                        <div className="flex items-center space-x-4">
                          <span>{store._count.services} serviço(s)</span>
                          <span>{store._count.appointments} agendamento(s)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/store/${store.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          Ver Loja
                        </Button>
                      </Link>
                      <Link href={`/admin/stores/${store.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={store.active ? "text-red-600" : "text-green-600"}
                      >
                        {store.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stores.filter(s => s.active).length}
                </div>
                <div className="text-sm text-muted-foreground">Lojas Ativas</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {stores.filter(s => !s.active).length}
              </div>
              <div className="text-sm text-muted-foreground">Lojas Inativas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stores.reduce((acc, store) => acc + store._count.services, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total de Serviços</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stores.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Lojas</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}