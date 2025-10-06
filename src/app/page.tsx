'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Star, Phone, Mail, MapPin as LocationIcon, Clock, Filter, SlidersHorizontal } from 'lucide-react'
import { RatingDisplay } from '@/components/reviews/RatingDisplay'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  _count: {
    stores: number
  }
}

interface Store {
  id: string
  name: string
  description?: string
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  slug: string
  logo?: string
  logoImage?: string
  category: Category
  averageRating: number
  totalReviews: number
  services?: {
    id: string
    name: string
    price: number
  }[]
  _count: {
    services: number
    appointments: number
  }
}

export default function Home() {
  const [stores, setStores] = useState<Store[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCity, setSelectedCity] = useState("")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAllCategories, setShowAllCategories] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchStores()
  }, [])

  useEffect(() => {
    fetchStores()
  }, [searchTerm, selectedCategory, selectedCity, priceRange, sortBy])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Erro ao buscar categorias:", error)
    }
  }

  const fetchStores = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory)
      if (selectedCity) params.append("city", selectedCity)
      if (priceRange && priceRange !== "all") params.append("priceRange", priceRange)
      if (sortBy) params.append("sortBy", sortBy)

      const response = await fetch(`/api/stores?${params}`)
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error("Erro ao buscar lojas:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedCity("")
    setPriceRange("all")
    setSortBy("relevance")
    setShowFilters(false)
  }

  const activeFiltersCount = [
    searchTerm, 
    selectedCategory !== "all" ? selectedCategory : "", 
    selectedCity, 
    priceRange !== "all" ? priceRange : ""
  ].filter(Boolean).length

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-primary/10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Agende com facilidade
              </span>
              <br />
              <span className="text-foreground">
                onde você estiver
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Conecte-se com os melhores profissionais da sua região. 
              <br className="hidden sm:block" />
              Agendamento inteligente, rápido e seguro.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-6 lg:p-8">
              {/* Main Search Row */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Buscar serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl bg-background/50"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl bg-background/50">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50">
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name} ({category._count.stores})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Cidade..."
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="pl-12 h-12 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl bg-background/50"
                  />
                </div>

                <Button onClick={fetchStores} className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 rounded-xl font-medium">
                  Buscar Agora
                </Button>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros Avançados
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Faixa de Preço
                      </label>
                      <Select value={priceRange} onValueChange={setPriceRange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Qualquer preço" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Qualquer preço</SelectItem>
                          <SelectItem value="0-50">Até R$ 50</SelectItem>
                          <SelectItem value="50-100">R$ 50 - R$ 100</SelectItem>
                          <SelectItem value="100-200">R$ 100 - R$ 200</SelectItem>
                          <SelectItem value="200+">Acima de R$ 200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ordenar por
                      </label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Relevância" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevância</SelectItem>
                          <SelectItem value="name">Nome A-Z</SelectItem>
                          <SelectItem value="newest">Mais Recentes</SelectItem>
                          <SelectItem value="rating">Melhor Avaliação</SelectItem>
                          <SelectItem value="distance">Distância</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button variant="outline" onClick={fetchStores} className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        Aplicar Filtros
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-rose-50 via-blue-50 to-purple-50 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,207,232,0.4),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(196,181,253,0.3),transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-300 to-transparent opacity-60"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-white/60 backdrop-blur-sm rounded-full mb-6 shadow-lg border border-rose-200/50">
              <div className="w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full animate-pulse"></div>
              <span className="mx-3 text-sm font-medium text-gray-700">Categorias em Destaque</span>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full animate-pulse"></div>
            </div>
            
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Categorias Populares
              </span>
            </h3>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Descubra os serviços mais procurados e conecte-se com profissionais qualificados
            </p>
          </div>
          
          {/* Centralized Categories Grid */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 max-w-5xl">
              {(showAllCategories ? categories : categories.slice(0, 6)).map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className="group relative p-6 sm:p-8 text-center bg-white/80 backdrop-blur-sm border border-rose-200/50 hover:border-purple-300/60 rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-purple-200/50 hover:scale-105 hover:bg-white/90 overflow-hidden min-h-[140px] sm:min-h-[160px] flex flex-col justify-center"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Soft Gradient Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-100/50 via-purple-50/30 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                  
                  {/* Gentle Border Glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-300/20 via-purple-300/20 to-blue-300/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
                  
                  {/* Icon Container */}
                  <div className="relative mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-rose-200/60 to-purple-200/60 rounded-2xl flex items-center justify-center group-hover:from-rose-300/70 group-hover:to-purple-300/70 transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <div className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300">
                        {category.icon || "🏪"}
                      </div>
                    </div>
                    
                    {/* Soft floating elements */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-bounce transition-opacity duration-300"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-bounce transition-opacity duration-300" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  
                  {/* Category Name */}
                  <div className="relative">
                    <h4 className="font-semibold text-sm sm:text-base mb-3 text-gray-700 group-hover:text-purple-700 transition-colors duration-300 leading-tight">
                      {category.name}
                    </h4>
                    
                    {/* Store Count Badge */}
                    <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-rose-100 to-purple-100 backdrop-blur-sm rounded-full border border-rose-200/50 group-hover:border-purple-300/60 transition-all duration-300 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-rose-400 to-purple-400 rounded-full mr-2 group-hover:animate-pulse"></div>
                      <span className="text-xs text-gray-600 font-medium">
                        {category._count.stores} lojas
                      </span>
                    </div>
                  </div>
                  
                  {/* Soft Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-200/0 via-purple-200/10 to-blue-200/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Show All Categories Button */}
          {categories.length > 6 && (
            <div className="text-center mt-12">
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="group inline-flex items-center px-8 py-4 bg-white/80 backdrop-blur-sm border border-rose-200/50 hover:border-purple-300/60 rounded-2xl text-gray-700 hover:text-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-purple-200/50 hover:scale-105 shadow-md"
              >
                <span className="font-medium mr-3">
                  {showAllCategories ? "Ver Menos Categorias" : "Ver Todas as Categorias"}
                </span>
                <div className="w-6 h-6 bg-gradient-to-r from-rose-400 to-purple-400 rounded-full flex items-center justify-center group-hover:rotate-180 transition-transform duration-300 shadow-sm">
                  <span className="text-sm text-white font-bold">
                    {showAllCategories ? "−" : "+"}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Stores List */}
      <section className="py-20 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {searchTerm || selectedCategory || selectedCity ? "Resultados da busca" : "Lojas em destaque"}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-6 text-muted-foreground text-lg">Carregando lojas...</p>
            </div>
          ) : stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stores.map((store) => (
                <div key={store.id} className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:scale-105 hover:border-primary/50">
                  <div className="p-8">
                    <div className="space-y-4 mb-6">
                      {/* Linha 1: Logo + Nome */}
                      <div className="flex items-center space-x-4">
                        {(store.logoImage || store.logo) && (
                          <div className="flex-shrink-0">
                            <img 
                              src={store.logoImage || store.logo} 
                              alt={`Logo ${store.name}`}
                              className="w-14 h-14 rounded-xl object-cover border-2 border-border/50 group-hover:border-primary/50 transition-colors"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate">{store.name}</h4>
                        </div>
                      </div>
                      
                      {/* Linha 2: Categoria */}
                      <div className="flex justify-start">
                        <p className="text-sm text-muted-foreground bg-accent/20 px-3 py-1 rounded-full inline-block">{store.category.name}</p>
                      </div>
                      
                      {/* Linha 3: Avaliação */}
                      <div className="flex justify-start">
                        <div className="flex items-center bg-yellow-500/10 px-3 py-1 rounded-full">
                          <RatingDisplay 
                            rating={store.averageRating} 
                            totalReviews={store.totalReviews}
                            size="sm"
                            showCount={false}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-2 leading-relaxed">
                      {store.description || "Descrição não disponível"}
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <span>{store.city || "Localização não informada"}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mr-3">
                          <Clock className="h-4 w-4 text-accent" />
                        </div>
                        <span>{store._count.services} serviços disponíveis</span>
                      </div>
                      {store.services && store.services.length > 0 && (
                        <div className="flex items-center text-sm">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold text-xs">R$</span>
                          </div>
                          <span className="font-semibold text-green-600">A partir de R$ {(() => {
                            const validPrices = store.services.filter(s => s.price && !isNaN(s.price)).map(s => s.price);
                            return validPrices.length > 0 ? Math.min(...validPrices).toFixed(2) : '0.00';
                          })()}</span>
                        </div>
                      )}
                      {store.services && store.services.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                          <span className="font-medium">Serviços:</span> {store.services.slice(0, 2).map(s => s.name).join(", ")}
                          {store.services.length > 2 && ` +${store.services.length - 2} mais`}
                        </div>
                      )}
                    </div>

                    <Link href={`/store/${store.slug}`}>
                      <Button className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 rounded-xl font-medium">
                        Ver Loja e Agendar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🔍</div>
              <h4 className="text-xl font-medium text-foreground mb-2">
                Nenhuma loja encontrada
              </h4>
              <p className="text-muted-foreground">
                Tente ajustar os filtros de busca ou explore outras categorias
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-background via-card to-accent/5 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <h4 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Agendalá
                </h4>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                A plataforma que conecta você aos melhores serviços da sua região com tecnologia e simplicidade.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-foreground">Para Clientes</h4>
              <ul className="space-y-3">
                <li><Link href="/como-funciona" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Como funciona
                </Link></li>
                <li><Link href="/categorias" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Categorias
                </Link></li>
                <li><Link href="/ajuda" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Ajuda
                </Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-foreground">Para Profissionais</h4>
              <ul className="space-y-3">
                <li><Link href="/cadastrar-loja" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Cadastrar Loja
                </Link></li>
                <li><Link href="/planos" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Planos
                </Link></li>
                <li><Link href="/suporte" className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center group">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Suporte
                </Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6 text-foreground">Contato</h4>
              <ul className="space-y-3">
                <li className="text-muted-foreground flex items-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-primary text-sm">@</span>
                  </div>
                  contato@agendafacil.com
                </li>
                <li className="text-muted-foreground flex items-center">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-accent text-sm">📞</span>
                  </div>
                  (11) 99999-9999
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-muted-foreground text-sm">
                &copy; 2024 Agendalá. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Política de Privacidade
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
