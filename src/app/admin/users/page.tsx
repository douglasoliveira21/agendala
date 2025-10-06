"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Users, Mail, Phone, Calendar } from "lucide-react"
import Link from "next/link"
import { PageLoading } from "@/components/ui/loading"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  createdAt: string
  _count: {
    stores: number
    appointments: number
  }
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "ADMIN") {
      router.push("/auth/signin")
      return
    }

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ADMIN: { label: "Administrador", variant: "destructive" as const },
      STORE_OWNER: { label: "Lojista", variant: "default" as const },
      CLIENT: { label: "Cliente", variant: "secondary" as const }
    }
    
    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (status === "loading" || loading) {
    return <PageLoading text="Carregando usuários..." />
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
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Usuários</CardTitle>
            <CardDescription>
              Encontre usuários por nome ou email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Digite o nome ou email do usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? "Tente ajustar os termos de busca" 
                    : "Os usuários aparecerão aqui quando forem cadastrados"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        {getRoleBadge(user.role)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {user.phone}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                        </div>

                        <div className="flex items-center space-x-4">
                          {user.role === "STORE_OWNER" && (
                            <span>{user._count.stores} loja(s)</span>
                          )}
                          <span>{user._count.appointments} agendamento(s)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      {user.role !== "ADMIN" && (
                        <Button variant="outline" size="sm">
                          Desativar
                        </Button>
                      )}
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
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === "CLIENT").length}
                </div>
                <div className="text-sm text-gray-600">Clientes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.role === "STORE_OWNER").length}
                </div>
                <div className="text-sm text-gray-600">Lojistas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === "ADMIN").length}
                </div>
                <div className="text-sm text-gray-600">Administradores</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {users.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}