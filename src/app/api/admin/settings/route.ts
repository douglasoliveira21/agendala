import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const settingsSchema = z.object({
  siteName: z.string().min(1, "Nome do site é obrigatório").optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email("Email inválido").optional(),
  contactPhone: z.string().optional(),
  allowRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().optional(),
  maxAdvanceBookingDays: z.number().min(1).max(365).optional(),
  minAdvanceHours: z.number().min(0).max(168).optional(),
  defaultBookingDuration: z.number().min(15).max(480).optional(),
  enableNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
})

// Configurações padrão do sistema
const defaultSettings = {
  siteName: "Sistema de Agendamento",
  siteDescription: "Plataforma completa para agendamento de serviços",
  contactEmail: "contato@agendamento.com",
  contactPhone: "",
  allowRegistration: true,
  requireEmailVerification: false,
  maintenanceMode: false,
  maintenanceMessage: "Sistema em manutenção. Voltaremos em breve.",
  maxAdvanceBookingDays: 30,
  minAdvanceHours: 24,
  defaultBookingDuration: 60,
  enableNotifications: true,
  enableSmsNotifications: false,
  enableEmailNotifications: true,
  currency: "BRL",
  timezone: "America/Sao_Paulo",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    // Buscar configurações do banco de dados
    const settings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true,
        type: true
      }
    })

    // Converter para objeto
    const settingsObject: any = { ...defaultSettings }
    
    settings.forEach(setting => {
      let value = setting.value
      
      // Converter tipos
      if (setting.type === "boolean") {
        value = value === "true"
      } else if (setting.type === "number") {
        value = parseFloat(value)
      }
      
      settingsObject[setting.key] = value
    })

    return NextResponse.json({ settings: settingsObject })
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
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = settingsSchema.parse(body)

    // Atualizar configurações no banco de dados
    const updatePromises = Object.entries(validatedData).map(async ([key, value]) => {
      const type = typeof value === "boolean" ? "boolean" : 
                   typeof value === "number" ? "number" : "string"
      
      return prisma.setting.upsert({
        where: { key },
        update: {
          value: String(value),
          type,
          updatedAt: new Date()
        },
        create: {
          key,
          value: String(value),
          type,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    })

    await Promise.all(updatePromises)

    // Buscar configurações atualizadas
    const updatedSettings = await prisma.setting.findMany({
      select: {
        key: true,
        value: true,
        type: true
      }
    })

    // Converter para objeto
    const settingsObject: any = { ...defaultSettings }
    
    updatedSettings.forEach(setting => {
      let value = setting.value
      
      // Converter tipos
      if (setting.type === "boolean") {
        value = value === "true"
      } else if (setting.type === "number") {
        value = parseFloat(value)
      }
      
      settingsObject[setting.key] = value
    })

    return NextResponse.json({ 
      message: "Configurações atualizadas com sucesso",
      settings: settingsObject 
    })
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}