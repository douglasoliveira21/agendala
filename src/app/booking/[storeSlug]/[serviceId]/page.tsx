'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, User, Phone, Mail, Tag, Check, X } from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
}

interface Store {
  id: string
  name: string
  slug: string
  phone: string
  primaryColor: string
  workingHours: any
  allowSimpleBooking: boolean
  category: {
    name: string
  }
  owner: {
    name: string
  }
}

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  
  const [store, setStore] = useState<Store | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [phoneAutoFilled, setPhoneAutoFilled] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isSimpleBooking, setIsSimpleBooking] = useState(false)

  useEffect(() => {
    if (params.storeSlug && params.serviceId) {
      fetchStoreAndService()
    }
  }, [params.storeSlug, params.serviceId])

  useEffect(() => {
    if (session?.user) {
      setClientName(session.user.name || '')
      setClientEmail(session.user.email || '')
      // Buscar dados completos do usuário para preencher o telefone WhatsApp
      fetchUserProfile()
    }
  }, [session])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          // Preencher telefone com WhatsApp se disponível, senão usar telefone comum
          const whatsappPhone = data.user.whatsappFullNumber || data.user.phone
          if (whatsappPhone && !clientPhone) {
            // Formatar telefone para o padrão esperado (55XXXXXXXXXXX)
            const cleanedPhone = whatsappPhone.replace(/\D/g, '') // Remove tudo que não é número
            const formattedPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`
            setClientPhone(formattedPhone)
            setPhoneAutoFilled(true)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error)
    }
  }

  useEffect(() => {
    if (selectedDate && store) {
      generateTimeSlots()
    }
  }, [selectedDate, store])

  const fetchStoreAndService = async () => {
    try {
      setLoading(true)
      
      // Buscar loja
      const storeResponse = await fetch(`/api/store/${params.storeSlug}`)
      if (!storeResponse.ok) throw new Error('Loja não encontrada')
      const storeData = await storeResponse.json()
      setStore(storeData.store)
      
      // Buscar serviço
      const serviceResponse = await fetch(`/api/service/${params.serviceId}`)
      if (!serviceResponse.ok) throw new Error('Serviço não encontrado')
      const serviceData = await serviceResponse.json()
      setService(serviceData.service)
      
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      setError('Erro ao carregar informações')
    } finally {
      setLoading(false)
    }
  }

  const generateTimeSlots = async () => {
    if (!store?.id || !service?.id || !selectedDate) return

    try {
      const response = await fetch(
        `/api/availability?storeId=${store.id}&serviceId=${service.id}&date=${selectedDate}`
      )
      
      if (!response.ok) {
        console.error('Erro ao buscar disponibilidade')
        setTimeSlots([])
        return
      }

      const data = await response.json()
      
      if (data.success) {
        setTimeSlots(data.data.timeSlots || [])
      } else {
        console.error('Erro na resposta da API:', data.error)
        setTimeSlots([])
      }
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error)
      setTimeSlots([])
    }
  }

  const validateCoupon = async () => {
    if (!couponCode.trim() || !store?.id || !service?.price) return

    try {
      setCouponValidating(true)
      setCouponError('')

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          storeId: store.id,
          amount: service.price,
          userId: session?.user?.id || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setAppliedCoupon(data.coupon)
        setCouponError('')
      } else {
        setCouponError(data.error || 'Cupom inválido')
        setAppliedCoupon(null)
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      setCouponError('Erro ao validar cupom')
      setAppliedCoupon(null)
    } finally {
      setCouponValidating(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setAppliedCoupon(null)
    setCouponError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação básica para ambos os tipos de agendamento
    if (!selectedDate || !selectedTime || !clientName || !clientPhone) {
      setError('Preencha todos os campos obrigatórios')
      return
    }

    // Validação adicional para agendamento completo
    if (!isSimpleBooking && !clientEmail) {
      setError('Email é obrigatório para agendamento completo')
      return
    }

    if (!store?.id || !service?.id) {
      setError('Erro: dados da loja ou serviço não encontrados')
      return
    }

    try {
      setSubmitting(true)
      setError('')

      // Formatar telefone para o padrão esperado (55XXXXXXXXXXX)
      const cleanedPhone = clientPhone.replace(/\D/g, '') // Remove tudo que não é número
      const formattedPhone = cleanedPhone.startsWith('55') ? cleanedPhone : `55${cleanedPhone}`

      const appointmentData = {
        storeId: store.id,
        serviceId: service.id,
        date: selectedDate,
        startTime: selectedTime,
        clientName,
        clientPhone: formattedPhone,
        isSimpleBooking: store?.allowSimpleBooking ? isSimpleBooking : false,
        ...(clientEmail && clientEmail.trim() ? { clientEmail: clientEmail.trim() } : {}),
        ...(appliedCoupon?.id ? { couponId: appliedCoupon.id } : {})
      }

      // Log dos dados que estão sendo enviados para debug
      console.log('📤 DEBUG - Dados sendo enviados:', JSON.stringify(appointmentData, null, 2))

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar agendamento')
      }

      const result = await response.json()
      
      // Agendamento criado com sucesso - redirecionar para página de confirmação
      // Removido: funcionalidade de pagamento desnecessária
      const appointmentId = result.appointment.id
      const confirmationUrl = `/booking/confirmation/${appointmentId}`
      
      // Redirecionar para página de confirmação
      window.location.href = confirmationUrl
      
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      setError(error.message || 'Erro ao criar agendamento')
    } finally {
      setSubmitting(false)
    }
  }

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

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30) // 30 dias no futuro
    return maxDate.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-orange-500 border-r-rose-500 mx-auto"></div>
             <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-b-pink-500 border-l-orange-500 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-6 text-white/80 font-medium">Carregando agendamento...</p>
        </div>
      </div>
    )
  }

  if (error && !store && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-md rounded-full p-6 border border-white/20">
              <X className="h-12 w-12 text-red-400 mx-auto" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado</h1>
          <p className="text-white/70 mb-8">{error}</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href={`/store/${store?.slug}`} 
              className="flex items-center text-primary hover:text-primary/80 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </Link>
            <h1 className="text-xl font-semibold text-foreground">
              Agendar Serviço
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Service Info */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Resumo do Agendamento
            </h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <h3 className="font-semibold text-foreground text-lg">{store?.name}</h3>
                <Badge variant="secondary" className="mt-2">
                  {store?.category.name}
                </Badge>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <h4 className="font-semibold text-foreground text-lg mb-2">{service?.name}</h4>
                {service?.description && (
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                )}
              </div>
              
              <div className="pt-4 border-t border-border space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-foreground">
                    <div className="p-2 bg-muted rounded-lg mr-3">
                       <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <span>{service && formatDuration(service.duration)}</span>
                  </div>
                  <div className="text-right">
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground line-through">
                          {service && formatPrice(service.price)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          -{appliedCoupon.type === 'PERCENTAGE' ? `${appliedCoupon.value}%` : formatPrice(appliedCoupon.discountAmount)}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(appliedCoupon.finalAmount)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-green-600">
                        {service && formatPrice(service.price)}
                      </span>
                    )}
                  </div>
                </div>
                
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl">
                    <div className="flex items-center text-green-700">
                      <Tag className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Cupom aplicado: {appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-600 hover:text-green-700 transition-colors duration-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Dados do Agendamento
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  <div className="flex items-center">
                    <div className="p-2 bg-muted rounded-lg mr-3">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    Data
                  </div>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                  required
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-muted rounded-lg mr-3">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      Horário
                    </div>
                  </label>
                  {timeSlots.length === 0 ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-yellow-700 text-sm">
                        Loja fechada neste dia ou carregando horários...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {timeSlots.map((slot) => (
                          <div key={slot.time} className="relative group">
                            <button
                              type="button"
                              onClick={() => slot.available && setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`w-full px-4 py-3 text-sm rounded-xl border transition-all duration-300 ${
                                selectedTime === slot.time
                                  ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                                  : slot.available
                                  ? 'bg-background text-foreground border-border hover:bg-muted hover:border-muted-foreground'
                                  : 'bg-red-50 text-red-500 border-red-200 cursor-not-allowed'
                              }`}
                            >
                              {slot.time}
                              {!slot.available && (
                                <span className="block text-xs mt-1">Indisponível</span>
                              )}
                            </button>
                            
                            {/* Tooltip para horários indisponíveis */}
                            {!slot.available && slot.reason && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap border border-border shadow-md">
                                {slot.reason}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Legenda */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-background border border-border rounded"></div>
                          <span>Disponível</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                          <span>Indisponível</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-primary rounded"></div>
                          <span>Selecionado</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Booking Type Selection */}
              {store?.allowSimpleBooking && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Tipo de Agendamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        isSimpleBooking 
                          ? 'border-primary bg-primary/5 shadow-lg' 
                          : 'border-border bg-background hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setIsSimpleBooking(true)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                          isSimpleBooking 
                            ? 'border-primary bg-primary shadow-lg' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSimpleBooking && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Cadastro Simples</h4>
                          <p className="text-sm text-muted-foreground">Apenas nome e WhatsApp</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        !isSimpleBooking 
                            ? 'border-primary bg-primary/5 shadow-lg' 
                          : 'border-border bg-background hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setIsSimpleBooking(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                          !isSimpleBooking 
                            ? 'border-primary bg-primary shadow-lg' 
                            : 'border-muted-foreground'
                        }`}>
                          {!isSimpleBooking && (
                            <div className="w-2 h-2 bg-primary-foreground rounded-full mx-auto mt-1"></div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">Cadastro Completo</h4>
                          <p className="text-sm text-muted-foreground">Nome, WhatsApp e email</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Client Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-foreground">
                  Seus Dados
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-muted rounded-lg mr-3">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      Nome Completo *
                    </div>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                    placeholder="Digite seu nome completo"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-muted rounded-lg mr-3">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        Telefone *
                      </div>
                      {phoneAutoFilled && (
                        <span className="text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                          WhatsApp preenchido automaticamente
                        </span>
                      )}
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => {
                        setClientPhone(e.target.value)
                        setPhoneAutoFilled(false) // Remove indicação se usuário editar
                      }}
                      className={`w-full px-4 py-3 border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 transition-all duration-300 ${
                        phoneAutoFilled 
                          ? 'border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500' 
                        : 'border-border bg-background focus:ring-primary focus:border-primary'
                      }`}
                      placeholder="Digite seu telefone/WhatsApp"
                      required
                    />
                    {phoneAutoFilled && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="p-1 bg-green-100 rounded-full">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Email field - only show for complete booking or when simple booking is not available */}
                {(!store?.allowSimpleBooking || !isSimpleBooking) && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                      <div className="flex items-center">
                        <div className="p-2 bg-muted rounded-lg mr-3">
                           <Mail className="w-4 h-4 text-primary" />
                        </div>
                        Email {!isSimpleBooking && store?.allowSimpleBooking ? '*' : ''}
                      </div>
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                      placeholder="Digite seu email"
                      required={!isSimpleBooking && store?.allowSimpleBooking}
                    />
                  </div>
                )}
              </div>

              {/* Coupon Section */}
              {!appliedCoupon && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Cupom de Desconto
                  </h3>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        <div className="flex items-center">
                          <div className="p-2 bg-muted rounded-lg mr-3">
                            <Tag className="w-4 h-4 text-primary" />
                          </div>
                          Código do Cupom
                        </div>
                      </label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Digite o código do cupom"
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={validateCoupon}
                        disabled={!couponCode.trim() || couponValidating}
                        className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {couponValidating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-transparent border-t-primary-foreground"></div>
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {couponError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-600 text-sm">{couponError}</p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <X className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  submitting || 
                  !selectedDate || 
                  !selectedTime || 
                  !clientName || 
                  !clientPhone ||
                  (!isSimpleBooking && store?.allowSimpleBooking && !clientEmail)
                }
                className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-primary-foreground mr-3"></div>
                    Agendando...
                  </div>
                ) : (
                  'Confirmar Agendamento'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}