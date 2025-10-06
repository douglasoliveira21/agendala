import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Buscar o usuário atual
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    // Criptografar a nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Atualizar a senha no banco de dados
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({ message: 'Senha alterada com sucesso' })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}