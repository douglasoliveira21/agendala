import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
// import { logger, measurePerformance } from '@/lib/logger'
// import { sanitizeName, sanitizeHtml, sanitizePhone } from '@/lib/validation'

const createCompanySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('BR'),
  timezone: z.string().default('America/Sao_Paulo'),
  currency: z.string().default('BRL'),
  language: z.string().default('pt-BR'),
  primaryColor: z.string().default('#3B82F6'),
  secondaryColor: z.string().default('#1F2937'),
  maxStores: z.number().int().min(1).default(1),
  maxUsers: z.number().int().min(1).default(5),
})

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    // logger.apiRequest('GET', '/api/companies', undefined, ip)
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      // logger.securityEvent('access_denied', 'unauthorized', {
      //   endpoint: '/api/companies',
      //   reason: 'no_session',
      //   ip
      // })
      const duration = Date.now() - startTime
      // logger.apiResponse('GET', '/api/companies', 401, duration)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      AND: [
        // Usuário deve ser owner da empresa ou membro
        {
          OR: [
            { ownerId: session.user.id },
            {
              users: {
                some: {
                  userId: session.user.id,
                  active: true
                }
              }
            }
          ]
        },
        // Filtro de busca
        search ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
            { email: { contains: search } }
          ]
        } : {}
      ]
    }

    const [companies, total] = await Promise.all([
        prisma.company.findMany({
          where,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            stores: {
              select: {
                id: true,
                name: true,
                active: true
              }
            },
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            subscription: {
              include: {
                plan: true
              }
            },
            _count: {
              select: {
                stores: true,
                users: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.company.count({ where })
      ])

    const duration = Date.now() - startTime
    // logger.apiResponse('GET', '/api/companies', 200, duration, session.user.id)

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    // logger.apiError('GET', '/api/companies', error as Error, undefined)
    // logger.apiResponse('GET', '/api/companies', 500, duration)
    
    console.error('Erro na API de companies:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    
    logger.apiRequest('POST', '/api/companies', session?.user?.id, clientIp, body)
    
    if (!session?.user?.id) {
      logger.securityEvent('unauthorized_access', {
        endpoint: '/api/companies',
        reason: 'No session',
        ip: clientIp
      })
      
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/companies', 401, duration)
      
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const validatedData = createCompanySchema.parse(body)

    // Sanitizar dados de entrada
    const sanitizedData = {
      ...validatedData,
      name: sanitizeName(validatedData.name),
      description: validatedData.description ? sanitizeHtml(validatedData.description) : undefined,
      phone: validatedData.phone ? sanitizePhone(validatedData.phone) : undefined
    }

    // Verificar se o slug já existe
    const existingCompany = await measurePerformance('check_company_slug', () =>
      prisma.company.findUnique({
        where: { slug: sanitizedData.slug }
      })
    )

    if (existingCompany) {
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/companies', 400, duration, session.user.id)
      
      return NextResponse.json(
        { error: 'Slug já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se o usuário já possui uma empresa (limite básico)
    const userCompanies = await measurePerformance('count_user_companies', () =>
      prisma.company.count({
        where: { ownerId: session.user.id }
      })
    )

    if (userCompanies >= 3) { // Limite de 3 empresas por usuário
      const duration = Date.now() - startTime
      logger.apiResponse('POST', '/api/companies', 400, duration, session.user.id)
      
      return NextResponse.json(
        { error: 'Limite de empresas atingido' },
        { status: 400 }
      )
    }

    const company = await measurePerformance('create_company', () =>
      prisma.company.create({
        data: {
          ...sanitizedData,
          ownerId: session.user.id,
          users: {
            create: {
              userId: session.user.id,
              role: 'OWNER'
            }
          }
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          stores: {
            select: {
              id: true,
              name: true,
              active: true
            }
          },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              stores: true,
              users: true
            }
          }
        }
      })
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/companies', 201, duration, session.user.id)

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    
    if (error instanceof z.ZodError) {
      logger.apiResponse('POST', '/api/companies', 400, duration, session?.user?.id)
      
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.apiError('POST', '/api/companies', error as Error, session?.user?.id)
    logger.apiResponse('POST', '/api/companies', 500, duration)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}