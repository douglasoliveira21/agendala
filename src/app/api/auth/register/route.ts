import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  whatsappCountryCode: z.string().min(1, "Código do país é obrigatório"),
  whatsappAreaCode: z.string().min(2, "DDD é obrigatório").max(2, "DDD deve ter 2 dígitos"),
  whatsappNumber: z.string().min(8, "Número do WhatsApp deve ter pelo menos 8 dígitos").max(9, "Número do WhatsApp deve ter no máximo 9 dígitos"),
  whatsappFullNumber: z.string().min(1, "Número completo do WhatsApp é obrigatório"),
  role: z.enum(["CLIENT", "STORE_OWNER", "ADMIN"]).default("CLIENT")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, phone, whatsappCountryCode, whatsappAreaCode, whatsappNumber, whatsappFullNumber, role } = registerSchema.parse(body)

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Usuário já existe com este email" },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        whatsappCountryCode,
        whatsappAreaCode,
        whatsappNumber,
        whatsappFullNumber,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}