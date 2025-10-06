import { z } from 'zod'

// Schemas de validação comuns
export const phoneSchema = z.string()
  .regex(/^55\d{10,11}$/, 'Telefone deve estar no formato 55XXXXXXXXXXX')
  .transform(phone => phone.replace(/\D/g, ''))

export const emailSchema = z.string()
  .email('Email inválido')
  .toLowerCase()
  .trim()

export const nameSchema = z.string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .trim()
  .transform(name => name.replace(/\s+/g, ' ')) // Normalizar espaços

export const passwordSchema = z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número')

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine(date => {
    // Comparar apenas as strings de data para evitar problemas de timezone
    const today = new Date().toISOString().split('T')[0]
    return date >= today
  }, 'Data deve ser válida e não pode ser no passado')

export const timeSchema = z.string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM')

export const priceSchema = z.number()
  .positive('Preço deve ser positivo')
  .max(99999.99, 'Preço muito alto')

// Schema para validação de CUID (usado pelo Prisma)
export const cuidSchema = z.string()
  .regex(/^c[a-z0-9]{24}$/, 'ID inválido')

// Schema para criação de agendamento
export const createAppointmentSchema = z.object({
  storeId: cuidSchema.refine(val => val.length >= 20, 'ID da loja inválido'),
  serviceId: cuidSchema.refine(val => val.length >= 20, 'ID do serviço inválido'),
  date: dateSchema,
  startTime: timeSchema,
  clientName: nameSchema,
  clientPhone: phoneSchema,
  clientEmail: emailSchema.optional(),
  notes: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional(),
  couponId: cuidSchema.refine(val => val.length >= 20, 'ID do cupom inválido').optional(),
  isSimpleBooking: z.boolean().optional().default(false)
})

// Schema para criação de usuário
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  whatsappCountryCode: z.string().min(1, "Código do país do WhatsApp é obrigatório"),
  whatsappAreaCode: z.string().min(2, "Código de área do WhatsApp é obrigatório"),
  whatsappNumber: z.string().min(8, "Número do WhatsApp é obrigatório"),
  whatsappFullNumber: z.string().min(10, "Número completo do WhatsApp é obrigatório"),
  role: z.enum(['ADMIN', 'STORE_OWNER', 'CLIENT'])
})

// Schema para criação de loja
export const createStoreSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(200, 'Endereço deve ter no máximo 200 caracteres'),
  whatsappCountryCode: z.string().min(1, "Código do país do WhatsApp é obrigatório"),
  whatsappAreaCode: z.string().min(2, "Código de área do WhatsApp é obrigatório"),
  whatsappNumber: z.string().min(8, "Número do WhatsApp é obrigatório"),
  whatsappFullNumber: z.string().min(10, "Número completo do WhatsApp é obrigatório"),
  categoryId: z.string().uuid('ID da categoria inválido'),
  ownerId: z.string().uuid('ID do proprietário inválido')
})

// Schema para criação de serviço
export const createServiceSchema = z.object({
  name: nameSchema,
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  price: priceSchema,
  duration: z.number().int().positive('Duração deve ser um número positivo').max(480, 'Duração máxima é 8 horas'),
  storeId: z.string().uuid('ID da loja inválido')
})

// Funções de sanitização
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizePhone(phone: string): string {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '')
  
  // Adiciona código do país se não tiver
  if (cleaned.length === 10 || cleaned.length === 11) {
    return '55' + cleaned
  }
  
  return cleaned
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalizar espaços
    .replace(/[^\w\s\u00C0-\u017F]/g, '') // Manter apenas letras, números, espaços e acentos
}

// Validação de arquivos
export function validateFile(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Tipo de arquivo não permitido' }
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Arquivo muito grande' }
  }
  
  return { valid: true }
}

// Validação de imagem
export function validateImage(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  return validateFile(file, allowedTypes, maxSize)
}

// Escape para SQL (embora o Prisma já faça isso)
export function escapeSql(input: string): string {
  return input.replace(/'/g, "''")
}

// Validação de CPF
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '')
  
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false
  }
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i)
  }
  
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  
  return remainder === parseInt(cpf.charAt(10))
}

// Validação de CNPJ
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '')
  
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false
  }
  
  let length = cnpj.length - 2
  let numbers = cnpj.substring(0, length)
  const digits = cnpj.substring(length)
  let sum = 0
  let pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11
  if (result !== parseInt(digits.charAt(0))) return false
  
  length = length + 1
  numbers = cnpj.substring(0, length)
  sum = 0
  pos = length - 7
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11
  
  return result === parseInt(digits.charAt(1))
}

// Rate limiting por IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const key = `rate_limit:${ip}`
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}