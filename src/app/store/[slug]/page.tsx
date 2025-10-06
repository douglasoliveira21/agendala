'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, MapPin, Phone, Mail } from 'lucide-react'
import { ReviewDisplay } from '@/components/reviews/ReviewDisplay'
import { ReviewForm } from '@/components/reviews/ReviewForm'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  isActive: boolean
}

interface Store {
  id: string
  name: string
  description?: string
  logo?: string
  banner?: string
  coverImage?: string
  logoImage?: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  slug: string
  primaryColor: string
  secondaryColor: string
  workingHours: any
  category: {
    id: string
    name: string
    slug: string
  }
  owner: {
    name: string
  }
  services: Service[]
}

export default function StorePage() {
  const params = useParams()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/store/${params.slug}`)
        
        if (!response.ok) {
          throw new Error('Loja não encontrada')
        }
        
        const data = await response.json()
        setStore(data.store)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar loja')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchStore()
    }
  }, [params.slug])

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(0)
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
    }
    return `${mins}min`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loja não encontrada</h1>
          <p className="text-gray-600 mb-6">A loja que você está procurando não existe.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">AgendaFácil</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Store Header with Banner */}
      <section 
        className="relative py-20 text-white min-h-[400px] flex items-center"
        style={{ 
          backgroundColor: store.primaryColor || '#3B82F6',
          backgroundImage: store.banner || store.coverImage ? `url(${store.banner || store.coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay for better text readability when there's a background image */}
        {(store.banner || store.coverImage) && (
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        )}
        
        {/* Banner placeholder when no banner is set */}
        {!(store.banner || store.coverImage) && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 opacity-90"></div>
        )}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            {/* Logo Section - Always reserve space */}
            <div className="mb-8">
              {(store.logo || store.logoImage) ? (
                <div className="relative inline-block">
                  <img 
                    src={store.logo || store.logoImage} 
                    alt={`Logo da ${store.name}`}
                    className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-xl bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  {/* Fallback logo placeholder */}
                  <div className="hidden w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl bg-white flex items-center justify-center">
                    <div className="text-4xl font-bold text-gray-400">
                      {store.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
              ) : (
                /* Logo placeholder when no logo is set */
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl bg-white flex items-center justify-center">
                  <div className="text-4xl font-bold text-gray-600">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
            
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              {store.category.name}
            </Badge>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">{store.name}</h1>
            {store.description && (
              <p className="text-xl opacity-90 mb-6 max-w-3xl mx-auto drop-shadow-md">
                {store.description}
              </p>
            )}
            <p className="text-lg opacity-80 drop-shadow-md">
              Proprietário: {store.owner.name}
            </p>
          </div>
        </div>
      </section>

      {/* Store Info */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Store Logo and Basic Info */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8 p-6 bg-gray-50 rounded-xl">
            {/* Logo Display */}
            <div className="flex-shrink-0">
              {(store.logo || store.logoImage) ? (
                <img 
                  src={store.logo || store.logoImage} 
                  alt={`Logo da ${store.name}`}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shadow-md bg-white"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {/* Fallback logo placeholder */}
              <div className={`w-20 h-20 rounded-lg border-2 border-gray-200 shadow-md bg-white flex items-center justify-center ${(store.logo || store.logoImage) ? 'hidden' : ''}`}>
                <div className="text-2xl font-bold text-gray-500">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            
            {/* Store Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h2>
              <Badge variant="outline" className="mb-3">
                {store.category.name}
              </Badge>
              {store.description && (
                <p className="text-gray-600 mb-2">{store.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Proprietário: {store.owner.name}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {store.address && (
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">Endereço</p>
                  <p className="text-gray-600">
                    {store.address}
                    {store.city && `, ${store.city}`}
                    {store.state && `, ${store.state}`}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="font-medium">Telefone</p>
                <p className="text-gray-600">{store.phone}</p>
              </div>
            </div>
            
            {store.email && (
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{store.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Serviços Disponíveis</h2>
          
          {store.services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Esta loja ainda não possui serviços cadastrados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {store.services.filter(service => service.active).map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.name}
                    </h3>
                    
                    {service.description && (
                      <p className="text-gray-600 mb-4">
                        {service.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="text-sm">{formatDuration(service.duration)}</span>
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    
                    <Link href={`/booking/${store.slug}/${service.id}`}>
                      <Button 
                        className="w-full"
                        style={{ backgroundColor: store.primaryColor || '#3B82F6' }}
                      >
                        Agendar Serviço
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Avaliações</h2>
          
          {/* Review Form */}
          <div className="mb-8">
            <ReviewForm storeId={store.id} />
          </div>
          
          {/* Reviews Display */}
          <ReviewDisplay storeId={store.id} />
        </div>
      </section>

      {/* Working Hours */}
      {store.workingHours && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Horário de Funcionamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(store.workingHours).map(([day, hours]: [string, any]) => (
                <div key={day} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">
                    {day === 'monday' && 'Segunda'}
                    {day === 'tuesday' && 'Terça'}
                    {day === 'wednesday' && 'Quarta'}
                    {day === 'thursday' && 'Quinta'}
                    {day === 'friday' && 'Sexta'}
                    {day === 'saturday' && 'Sábado'}
                    {day === 'sunday' && 'Domingo'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {hours.active ? `${hours.start} - ${hours.end}` : 'Fechado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}