'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoading } from '@/components/ui/loading'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Eye,
  EyeOff,
  Lock,
  RefreshCw
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  bio?: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'STORE_OWNER') {
      router.push('/dashboard')
      return
    }

    loadProfile()
  }, [session, status, router])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (response.ok) {
        setProfile(data)
      } else {
        console.error('Erro ao carregar perfil:', data.error)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Perfil atualizado com sucesso!')
      } else {
        alert('Erro ao atualizar perfil: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      alert('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Senha alterada com sucesso!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordForm(false)
      } else {
        alert('Erro ao alterar senha: ' + data.error)
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      alert('Erro ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return <PageLoading text="Carregando perfil..." />
  }

  if (!session || session.user.role !== 'STORE_OWNER') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header */}
      <div className="bg-card/10 backdrop-blur-md border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/dashboard")}
              className="mr-4 text-foreground hover:bg-accent/10 border-border/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Meu Perfil
                </span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie suas informações pessoais e configurações de conta
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Informações Pessoais */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais e de contato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={profile.zipCode || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, complemento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={profile.city || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Sua cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={profile.state || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="SP"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Gerencie sua senha e configurações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordForm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Senha</h3>
                    <p className="text-sm text-muted-foreground">
                      Última alteração há mais de 30 dias
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Alterar Senha
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Digite sua nova senha"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirme sua nova senha"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Alterar Senha'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}