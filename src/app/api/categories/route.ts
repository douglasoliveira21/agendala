import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger, measurePerformance } from "@/lib/logger"
import { sanitizeName, sanitizeHtml } from "@/lib/validation"

const createCategorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  icon: z.string().optional()
})

// GET - Listar categorias
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/categories', undefined, ip)
    
    const categories = await measurePerformance('fetch_categories', () =>
      prisma.category.findMany({
        where: { active: true },
        include: {
          _count: {
            select: {
              stores: true
            }
          }
        },
        orderBy: { name: "asc" }
      })
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/categories', 200, duration)

    return NextResponse.json({ categories })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/categories', error as Error, undefined)
    logger.apiResponse('GET', '/api/categories', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar categoria (apenas admin)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const body = await request.json()
    logger.apiRequest('POST', '/api/categories', body, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      logger.securityEvent('access_denied', 'insufficient_permissions', {
        endpoint: '/api/categories',
        reason: 'not_admin',
        role: session?.user?.role,
        ip
      })
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/categories', 403, duration)
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const data = createCategorySchema.parse(body)

    // Gerar slug único
    const baseSlug = data.name.toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")

    let slug = baseSlug
    let counter = 1
    
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug
      }
    })

    return NextResponse.json({
      message: "Categoria criada com sucesso",
      category
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}