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
  icon: z.string().optional(),
  active: z.boolean().default(true)
})

// GET - Listar todas as categorias (admin)
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    logger.apiRequest('GET', '/api/admin/categories', undefined, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const categories = await measurePerformance('fetch_admin_categories', () =>
      prisma.category.findMany({
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
    logger.apiResponse('GET', '/api/admin/categories', 200, duration)

    return NextResponse.json({ categories })

  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiError('GET', '/api/admin/categories', error as Error, undefined)
    logger.apiResponse('GET', '/api/admin/categories', 500, duration)
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar categoria (admin)
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    logger.apiRequest('POST', '/api/admin/categories', body, ip)

    const validatedData = createCategorySchema.parse(body)

    // Verificar se já existe uma categoria com o mesmo nome
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 400 }
      )
    }

    // Gerar slug único
    let slug = sanitizeName(validatedData.name)
    let counter = 1
    while (await prisma.category.findUnique({ where: { slug } })) {
      slug = `${sanitizeName(validatedData.name)}-${counter}`
      counter++
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        description: validatedData.description ? sanitizeHtml(validatedData.description) : null,
        icon: validatedData.icon,
        slug,
        active: validatedData.active
      },
      include: {
        _count: {
          select: {
            stores: true
          }
        }
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/admin/categories', 201, duration)

    return NextResponse.json({ 
      message: "Categoria criada com sucesso",
      category 
    }, { status: 201 })

  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiResponse('POST', '/api/admin/categories', 400, duration)
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('POST', '/api/admin/categories', error as Error, undefined)
    logger.apiResponse('POST', '/api/admin/categories', 500, duration)
    
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}