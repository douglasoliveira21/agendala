"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  label?: string
  currentImage?: string
  onUpload: (url: string) => void
  onRemove: () => void
  type: 'logo' | 'cover'
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  label,
  currentImage,
  onUpload,
  onRemove,
  type,
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    console.log('🔍 [IMAGE-UPLOAD] Iniciando upload de arquivo:', file.name, 'Tipo:', type)
    console.log('🔍 [IMAGE-UPLOAD] Tamanho do arquivo:', file.size, 'bytes')
    console.log('🔍 [IMAGE-UPLOAD] Tipo MIME:', file.type)

    // Validações do lado do cliente
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [IMAGE-UPLOAD] Tipo de arquivo não permitido:', file.type)
      alert('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('❌ [IMAGE-UPLOAD] Arquivo muito grande:', file.size, 'bytes')
      alert('Arquivo muito grande. Máximo 5MB')
      return
    }

    setIsUploading(true)

    try {
      console.log('🔍 [IMAGE-UPLOAD] Criando FormData...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      console.log('🔍 [IMAGE-UPLOAD] Enviando para /api/upload...')
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      console.log('🔍 [IMAGE-UPLOAD] Resposta da API - Status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ [IMAGE-UPLOAD] Erro na resposta da API:', error)
        throw new Error(error.error || 'Erro no upload')
      }

      const result = await response.json()
      console.log('✅ [IMAGE-UPLOAD] Upload realizado com sucesso!')
      console.log('🔍 [IMAGE-UPLOAD] Resultado:', JSON.stringify(result, null, 2))
      console.log('🔍 [IMAGE-UPLOAD] URL da imagem:', result.url)
      console.log('🔍 [IMAGE-UPLOAD] Chamando callback onUpload com URL:', result.url)
      
      onUpload(result.url)
      
      console.log('✅ [IMAGE-UPLOAD] Callback onUpload executado')
    } catch (error) {
      console.error('❌ [IMAGE-UPLOAD] Erro no upload:', error)
      alert(error instanceof Error ? error.message : 'Erro no upload da imagem')
    } finally {
      setIsUploading(false)
      console.log('🔍 [IMAGE-UPLOAD] Upload finalizado (isUploading = false)')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleRemove = async () => {
    if (!currentImage) return

    try {
      // Extrair nome do arquivo da URL
      const fileName = currentImage.split('/').pop()
      if (fileName) {
        await fetch(`/api/upload?fileName=${fileName}`, {
          method: 'DELETE'
        })
      }
      onRemove()
    } catch (error) {
      console.error('Erro ao remover imagem:', error)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={`upload-${type}`}>{label}</Label>
      
      <Card className="p-4">
        {currentImage ? (
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={currentImage}
                alt={label || ''}
                width={type === 'logo' ? 200 : 400}
                height={type === 'logo' ? 200 : 200}
                className={`rounded-lg object-cover ${
                  type === 'logo' ? 'w-48 h-48' : 'w-full h-48'
                }`}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={disabled || isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Alterar Imagem
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              Arraste uma imagem aqui ou clique para selecionar
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Formatos aceitos: JPEG, PNG, WebP (máx. 5MB)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={disabled || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Enviando...' : 'Selecionar Imagem'}
            </Button>
          </div>
        )}
      </Card>

      <Input
        ref={fileInputRef}
        id={`upload-${type}`}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  )
}