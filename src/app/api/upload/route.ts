import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'logo' ou 'cover'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!type || !['logo', 'cover'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de imagem inválido' }, { status: 400 })
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Use JPEG, PNG ou WebP' 
      }, { status: 400 })
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Máximo 5MB' 
      }, { status: 400 })
    }

    // Criar diretório se não existir
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const fileName = `${type}-${session.user.id}-${timestamp}${extension}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // Converter arquivo para buffer e salvar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar URL pública do arquivo
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName,
      type,
      size: file.size
    })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json({ error: 'Nome do arquivo não fornecido' }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, fileName)

    // Verificar se o arquivo existe e pertence ao usuário
    if (!existsSync(filePath) || !fileName.includes(session.user.id)) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Remover arquivo
    const fs = require('fs').promises
    await fs.unlink(filePath)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}