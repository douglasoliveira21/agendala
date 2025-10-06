'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MapPin, Star, Phone, Mail, Clock, Filter, SlidersHorizontal } from 'lucide-react'
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

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCity, setSelectedCity] = useState("")
  const [priceRange, setPriceRange] = useState("all")
  const [sortBy, setSortBy] = useState("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)

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
  }

  const getUniqueCity = () => {
    const cities = stores.map(store => store.city).filter(Boolean)
    return [...new Set(cities)]
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Encontre a Loja Perfeita</h1>
            <p className="text-xl opacity-90 mb-8">
              Descubra os melhores estabelecimentos da sua região
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Buscar por nome, serviço ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 text-lg bg-background text-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </Button>
              
              {showFilters && (
                <>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as cidades</SelectItem>
                      {getUniqueCity().map((city) => (
                        <SelectItem key={city} value={city!}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevância</SelectItem>
                      <SelectItem value="rating">Melhor avaliação</SelectItem>
                      <SelectItem value="name">Nome A-Z</SelectItem>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="ghost" onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                </>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {stores.length} {stores.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma loja encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou buscar por outros termos
            </p>
            <Button onClick={clearFilters}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="space-y-3">
                    {/* Linha 1: Logo + Nome */}
                    <div className="flex items-center space-x-3">
                      {(store.logoImage || store.logo) && (
                        <div className="flex-shrink-0">
                          <img 
                            src={store.logoImage || store.logo} 
                            alt={`Logo ${store.name}`}
                            className="w-12 h-12 rounded-lg object-cover border border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{store.name}</CardTitle>
                      </div>
                    </div>
                    
                    {/* Linha 2: Categoria */}
                    <div className="flex justify-start">
                      <Badge variant="secondary" className="text-xs">
                        {store.category.icon} {store.category.name}
                      </Badge>
                    </div>
                    
                    {/* Linha 3: Avaliação */}
                    {store.averageRating > 0 && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{(store.averageRating && !isNaN(store.averageRating) ? store.averageRating : 0).toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {store.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {store.address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{store.address}, {store.city}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{store.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      {store._count.services} serviços
                    </div>
                    
                    <Link href={`/store/${store.slug}`}>
                      <Button size="sm">
                        Ver detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}