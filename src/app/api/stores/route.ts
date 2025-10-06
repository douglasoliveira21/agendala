import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger, measurePerformance } from "@/lib/logger"
import { sanitizeName, sanitizeHtml, sanitizePhone } from "@/lib/validation"
import { cache, CacheTTL } from "@/lib/cache"
import { z } from "zod"

const createStoreSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  categoryId: z.string(),
  primaryColor: z.string().default("#3B82F6"),
  secondaryColor: z.string().default("#1F2937"),
  whatsappCountryCode: z.string().min(1, "Código do país do WhatsApp é obrigatório"),
  whatsappAreaCode: z.string().min(2, "Código de área do WhatsApp é obrigatório"),
  whatsappNumber: z.string().min(8, "Número do WhatsApp é obrigatório"),
  whatsappFullNumber: z.string().min(10, "Número completo do WhatsApp é obrigatório"),
  workingHours: z.object({
    monday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    tuesday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    wednesday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    thursday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    friday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    saturday: z.object({ start: z.string(), end: z.string(), active: z.boolean() }),
    sunday: z.object({ start: z.string(), end: z.string(), active: z.boolean() })
  }).optional()
})

// GET - Listar lojas
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/stores', undefined, ip)
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const city = searchParams.get("city")
    const search = searchParams.get("search")
    const priceRange = searchParams.get("priceRange")
    const sortBy = searchParams.get("sortBy") || "relevance"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const myStores = searchParams.get("myStores") === "true"

    // Gerar chave de cache baseada nos parâmetros de busca
    const cacheKey = `stores:${JSON.stringify({
      category,
      city,
      search,
      priceRange,
      sortBy,
      page,
      limit,
      myStores
    })}`

    // Verificar cache primeiro (apenas para buscas públicas)
    if (!myStores) {
      const cached = await cache.get(cacheKey)
      if (cached) {
        const duration = Date.now() - startTime
        logger.apiResponse('GET', '/api/stores', 200, duration, undefined, { cached: true })
        return NextResponse.json(cached)
      }
    }

    // Se for para buscar as lojas do usuário autenticado
    if (myStores) {
      const session = await getServerSession(authOptions)
      
      if (!session || session.user.role !== "STORE_OWNER") {
        logger.securityEvent('access_denied', { 
          endpoint: '/api/stores', 
          reason: 'not_store_owner',
          ip 
        })
        return NextResponse.json(
          { error: "Acesso negado" },
          { status: 403 }
        )
      }

      const userStores = await measurePerformance('fetch_user_stores', () =>
        prisma.store.findMany({
          where: {
            ownerId: session.user.id
          },
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true,
            state: true,
            phone: true,
            email: true,
            logo: true,
            logoImage: true,
            slug: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            category: true,
            _count: {
              select: {
                services: true,
                appointments: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      )

      const duration = Date.now() - startTime
      logger.apiResponse('GET', '/api/stores', 200, duration, session.user.id)

      return NextResponse.json({
        stores: userStores,
        pagination: {
          page: 1,
          limit: userStores.length,
          total: userStores.length,
          pages: 1
        }
      })
    }

    const where: any = {
      active: true
    }

    if (category) {
      where.category = { slug: category }
    }

    if (city) {
      where.OR = [
        ...(where.OR || []),
        { city: { contains: city } },
        { state: { contains: city } }
      ]
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Filtro por faixa de preço (baseado nos serviços da loja)
    if (priceRange) {
      const [min, max] = priceRange.includes("-") 
        ? priceRange.split("-").map(p => p === "+" ? 999999 : parseInt(p))
        : priceRange === "200+" 
          ? [200, 999999]
          : [0, parseInt(priceRange)]

      where.services = {
        some: {
          price: {
            gte: min,
            ...(max !== 999999 && { lte: max })
          }
        }
      }
    }

    // Definir ordenação
    let orderBy: any = { createdAt: "desc" }
    
    switch (sortBy) {
      case "name":
        orderBy = { name: "asc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "rating":
        // Para implementar quando tivermos sistema de avaliações
        orderBy = { createdAt: "desc" }
        break
      case "distance":
        // Para implementar quando tivermos geolocalização
        orderBy = { createdAt: "desc" }
        break
      default: // relevance
        orderBy = { createdAt: "desc" }
    }

    // Para ordenação por rating, precisamos buscar as lojas com suas avaliações
    let storesQuery: any = {
      where,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        phone: true,
        email: true,
        logo: true,
        logoImage: true,
        slug: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        services: {
          select: {
            id: true,
            name: true,
            price: true
          },
          take: 3,
          orderBy: { price: "asc" }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            services: true,
            appointments: true,
            reviews: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
    }

    // Se não for ordenação por rating, aplicamos orderBy diretamente
    if (sortBy !== "rating") {
      storesQuery.orderBy = orderBy
    }

    const [storesResult, total] = await measurePerformance('fetch_public_stores', () =>
      Promise.all([
        prisma.store.findMany(storesQuery),
        prisma.store.count({ where })
      ])
    )

    // Se for ordenação por rating, calculamos a média e ordenamos
    let stores = storesResult
    if (sortBy === "rating") {
      stores = storesResult
        .map(store => ({
          ...store,
          averageRating: store.reviews.length > 0 
            ? store.reviews.reduce((sum, review) => sum + review.rating, 0) / store.reviews.length
            : 0
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
    }

    // Adicionar informações de avaliação para todas as lojas
    const storesWithRating = stores.map(store => {
      const averageRating = store.reviews.length > 0 
        ? store.reviews.reduce((sum, review) => sum + review.rating, 0) / store.reviews.length
        : 0

      return {
        ...store,
        averageRating: Math.round(averageRating * 10) / 10, // Arredondar para 1 casa decimal
        totalReviews: store._count.reviews,
        // Remover reviews do retorno para não expor dados desnecessários
        reviews: undefined
      }
    })

    const result = {
      stores: storesWithRating,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    // Salvar no cache apenas para buscas públicas
    if (!myStores) {
      await cache.set(cacheKey, result, CacheTTL.MEDIUM)
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/stores', 200, duration)

    return NextResponse.json(result)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/stores', error as Error, undefined)
    logger.apiResponse('GET', '/api/stores', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar loja
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('POST', '/api/stores', body, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== "STORE_OWNER" && session.user.role !== "ADMIN")) {
      logger.securityEvent('access_denied', { 
        endpoint: '/api/stores', 
        reason: 'invalid_role',
        role: session?.user?.role,
        ip 
      })
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const data = createStoreSchema.parse(body)
    
    // Sanitizar dados de entrada
    const sanitizedData = {
      ...data,
      name: sanitizeName(data.name),
      description: data.description ? sanitizeHtml(data.description) : undefined,
      phone: sanitizePhone(data.phone),
      address: data.address ? sanitizeHtml(data.address) : undefined,
      city: data.city ? sanitizeName(data.city) : undefined,
      state: data.state ? sanitizeName(data.state) : undefined
    }

    // Gerar slug único
    const baseSlug = sanitizedData.name.toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    let slug = baseSlug
    let counter = 1
    
    while (await measurePerformance('check_slug_uniqueness', () => 
      prisma.store.findUnique({ where: { slug } })
    )) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const store = await measurePerformance('create_store', () =>
      prisma.store.create({
        data: {
          ...sanitizedData,
          slug,
          ownerId: session.user.id,
          workingHours: sanitizedData.workingHours || {
            monday: { start: "09:00", end: "18:00", active: true },
            tuesday: { start: "09:00", end: "18:00", active: true },
            wednesday: { start: "09:00", end: "18:00", active: true },
            thursday: { start: "09:00", end: "18:00", active: true },
            friday: { start: "09:00", end: "18:00", active: true },
            saturday: { start: "09:00", end: "12:00", active: true },
            sunday: { start: "09:00", end: "12:00", active: false }
          }
        },
        include: {
          category: true
        }
      })
    )

    logger.info('Store created', { 
      storeId: store.id, 
      userId: session.user.id, 
      storeName: store.name,
      ip 
    })

    // Invalidar cache de lojas
    await cache.delPattern('stores:*')

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/stores', 201, duration, session.user.id)

    return NextResponse.json({
      message: "Loja criada com sucesso",
      store
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiError('POST', '/api/stores', error, undefined)
      logger.apiResponse('POST', '/api/stores', 400, duration)
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('POST', '/api/stores', error as Error, undefined)
    logger.apiResponse('POST', '/api/stores', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}