import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { whatsappService } from "@/lib/whatsapp"

// GET - Listar templates de mensagens
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json(
        { error: "ID da loja é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Buscar templates personalizados da loja
    const customTemplates = await prisma.whatsAppTemplate.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    })

    // Obter templates padrão
    const defaultTemplates = [
      {
        id: 'default-confirmation',
        name: 'Confirmação de Agendamento',
        type: 'CONFIRMATION',
        template: whatsappService.generateConfirmationMessage(
          '{{storeName}}',
          '{{clientName}}',
          '{{serviceName}}',
          '{{date}}',
          '{{time}}'
        ),
        isDefault: true
      },
      {
        id: 'default-reminder',
        name: 'Lembrete de Agendamento',
        type: 'REMINDER',
        template: whatsappService.generateReminderMessage(
          '{{storeName}}',
          '{{clientName}}',
          '{{serviceName}}',
          '{{date}}',
          '{{time}}'
        ),
        isDefault: true
      },
      {
        id: 'default-cancellation',
        name: 'Cancelamento de Agendamento',
        type: 'CANCELLATION',
        template: whatsappService.generateCancellationMessage(
          '{{storeName}}',
          '{{clientName}}',
          '{{serviceName}}',
          '{{date}}',
          '{{time}}'
        ),
        isDefault: true
      }
    ]

    return NextResponse.json({
      customTemplates,
      defaultTemplates
    })

  } catch (error) {
    console.error("Erro ao buscar templates:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST - Criar template personalizado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { storeId, name, type, template } = await request.json()

    if (!storeId || !name || !type || !template) {
      return NextResponse.json(
        { error: "storeId, name, type e template são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se a loja pertence ao usuário
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: "Loja não encontrada" },
        { status: 404 }
      )
    }

    // Criar template
    const newTemplate = await prisma.whatsAppTemplate.create({
      data: {
        storeId,
        name,
        type,
        template
      }
    })

    return NextResponse.json({
      message: "Template criado com sucesso",
      template: newTemplate
    })

  } catch (error) {
    console.error("Erro ao criar template:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { id, name, template } = await request.json()

    if (!id || !name || !template) {
      return NextResponse.json(
        { error: "id, name e template são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se o template existe e pertence ao usuário
    const existingTemplate = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        store: {
          ownerId: session.user.id
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    // Atualizar template
    const updatedTemplate = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name,
        template,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "Template atualizado com sucesso",
      template: updatedTemplate
    })

  } catch (error) {
    console.error("Erro ao atualizar template:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Excluir template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "STORE_OWNER") {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do template é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o template existe e pertence ao usuário
    const template = await prisma.whatsAppTemplate.findFirst({
      where: {
        id,
        store: {
          ownerId: session.user.id
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      )
    }

    // Excluir template
    await prisma.whatsAppTemplate.delete({
      where: { id }
    })

    return NextResponse.json({
      message: "Template excluído com sucesso"
    })

  } catch (error) {
    console.error("Erro ao excluir template:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}