import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSettingsSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor primária inválida"),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor secundária inválida"),
  workingHours: z.record(z.object({
    start: z.string(),
    end: z.string(),
    active: z.boolean()
  })),
  advanceBookingDays: z.number().min(1).max(365),
  minAdvanceHours: z.number().min(0).max(72),
  whatsappNumber: z.string().optional(),
  whatsappCountryCode: z.string().min(1, "Código do país é obrigatório"),
  whatsappAreaCode: z.string().min(2, "DDD deve ter 2 dígitos").max(2, "DDD deve ter 2 dígitos"),
  whatsappFullNumber: z.string().min(1, "Número completo do WhatsApp é obrigatório"),
  coverImage: z.string().optional(),
  logoImage: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        primaryColor: true,
        secondaryColor: true,
        workingHours: true,
        advanceBookingDays: true,
        minAdvanceHours: true,
        whatsappNumber: true,
        whatsappCountryCode: true,
        whatsappAreaCode: true,
        whatsappFullNumber: true,
        coverImage: true,
        logoImage: true
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Garantir que workingHours tenha uma estrutura padrão se for null
    const defaultWorkingHours = {
      monday: { start: "09:00", end: "18:00", active: true },
      tuesday: { start: "09:00", end: "18:00", active: true },
      wednesday: { start: "09:00", end: "18:00", active: true },
      thursday: { start: "09:00", end: "18:00", active: true },
      friday: { start: "09:00", end: "18:00", active: true },
      saturday: { start: "09:00", end: "12:00", active: false },
      sunday: { start: "09:00", end: "12:00", active: false }
    }

    const workingHours = store.workingHours || defaultWorkingHours

    return NextResponse.json({
      ...store,
      workingHours
    })

  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = updateSettingsSchema.parse(body)

    // Buscar loja do usuário
    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Atualizar loja
    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        phone: validatedData.phone,
        email: validatedData.email || null,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        zipCode: validatedData.zipCode,
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        workingHours: validatedData.workingHours,
        advanceBookingDays: validatedData.advanceBookingDays,
        minAdvanceHours: validatedData.minAdvanceHours,
        whatsappNumber: validatedData.whatsappNumber,
        whatsappCountryCode: validatedData.whatsappCountryCode,
        whatsappAreaCode: validatedData.whatsappAreaCode,
        whatsappFullNumber: validatedData.whatsappFullNumber,
        coverImage: validatedData.coverImage,
        logoImage: validatedData.logoImage
      },
      select: {
        id: true,
        name: true,
        description: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        primaryColor: true,
        secondaryColor: true,
        workingHours: true,
        advanceBookingDays: true,
        minAdvanceHours: true,
        whatsappNumber: true,
        whatsappCountryCode: true,
        whatsappAreaCode: true,
        whatsappFullNumber: true,
        coverImage: true,
        logoImage: true
      }
    })

    return NextResponse.json(updatedStore)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}