import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Limpar dados existentes
  await prisma.appointment.deleteMany()
  await prisma.service.deleteMany()
  await prisma.store.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  // Criar categorias
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Beleza e Estética',
        slug: 'beleza-estetica',
        description: 'Salões de beleza, barbearias, estética',
        icon: '💄',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Saúde e Bem-estar',
        slug: 'saude-bem-estar',
        description: 'Clínicas, consultórios, terapias',
        icon: '🏥',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Serviços Automotivos',
        slug: 'servicos-automotivos',
        description: 'Oficinas, lava-jatos, mecânicos',
        icon: '🚗',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Educação',
        slug: 'educacao',
        description: 'Aulas particulares, cursos, treinamentos',
        icon: '📚',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Serviços Domésticos',
        slug: 'servicos-domesticos',
        description: 'Limpeza, jardinagem, reparos',
        icon: '🏠',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pets e Cuidados Animais',
        slug: 'pets-cuidados-animais',
        description: 'Pet shops, veterinários, adestramento',
        icon: '🐾',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Eventos e Fotografia',
        slug: 'eventos-fotografia',
        description: 'Fotógrafos, organizadores de eventos, buffets',
        icon: '📸',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Consultoria',
        slug: 'consultoria',
        description: 'Consultores, advogados, contadores, arquitetos',
        icon: '💼',
        active: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Empresarial',
        slug: 'empresarial',
        description: 'Serviços corporativos, treinamentos empresariais',
        icon: '🏢',
        active: true,
      },
    }),
  ])

  console.log('✅ Categorias criadas')

  // Criar usuários
  const adminPassword = await bcrypt.hash('123456', 12)
  const storeOwnerPassword = await bcrypt.hash('123456', 12)
  const clientPassword = await bcrypt.hash('123456', 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@agendafacil.com',
      password: adminPassword,
      role: 'ADMIN',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '999990000',
      whatsappFullNumber: '+5511999990000',
    },
  })

  const storeOwner1 = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'loja@agendafacil.com',
      password: storeOwnerPassword,
      phone: '(11) 99999-1111',
      role: 'STORE_OWNER',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '999991111',
      whatsappFullNumber: '+5511999991111',
    },
  })

  const storeOwner2 = await prisma.user.create({
    data: {
      name: 'João Santos',
      email: 'joao@agendafacil.com',
      password: storeOwnerPassword,
      phone: '(11) 99999-2222',
      role: 'STORE_OWNER',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '999992222',
      whatsappFullNumber: '+5511999992222',
    },
  })

  const client = await prisma.user.create({
    data: {
      name: 'Ana Costa',
      email: 'cliente@agendafacil.com',
      password: clientPassword,
      phone: '(11) 99999-3333',
      role: 'CLIENT',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '999993333',
      whatsappFullNumber: '+5511999993333',
    },
  })

  console.log('✅ Usuários criados')

  // Criar lojas
  const store1 = await prisma.store.create({
    data: {
      name: 'Salão Beleza Total',
      slug: 'salao-beleza-total',
      description: 'Salão de beleza completo com serviços de cabelo, manicure, pedicure e estética facial.',
      phone: '(11) 3333-1111',
      email: 'contato@belezatotal.com',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      categoryId: categories[0].id,
      ownerId: storeOwner1.id,
      active: true,
      primaryColor: '#FF6B9D',
      secondaryColor: '#4ECDC4',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '333311111',
      whatsappFullNumber: '+551133331111',
      workingHours: {
        monday: { start: '08:00', end: '18:00', active: true },
        tuesday: { start: '08:00', end: '18:00', active: true },
        wednesday: { start: '08:00', end: '18:00', active: true },
        thursday: { start: '08:00', end: '18:00', active: true },
        friday: { start: '08:00', end: '18:00', active: true },
        saturday: { start: '08:00', end: '16:00', active: true },
        sunday: { start: '00:00', end: '00:00', active: false },
      },
    },
  })

  const store2 = await prisma.store.create({
    data: {
      name: 'Auto Center Premium',
      slug: 'auto-center-premium',
      description: 'Oficina mecânica especializada em carros importados e nacionais. Serviços de qualidade.',
      phone: '(11) 3333-2222',
      email: 'contato@autocenterpremium.com',
      address: 'Av. dos Mecânicos, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-890',
      categoryId: categories[2].id,
      ownerId: storeOwner2.id,
      active: true,
      primaryColor: '#2196F3',
      secondaryColor: '#FF9800',
      whatsappCountryCode: '+55',
      whatsappAreaCode: '11',
      whatsappNumber: '333322222',
      whatsappFullNumber: '+551133332222',
      workingHours: {
        monday: { start: '07:00', end: '17:00', active: true },
        tuesday: { start: '07:00', end: '17:00', active: true },
        wednesday: { start: '07:00', end: '17:00', active: true },
        thursday: { start: '07:00', end: '17:00', active: true },
        friday: { start: '07:00', end: '17:00', active: true },
        saturday: { start: '07:00', end: '12:00', active: true },
        sunday: { start: '00:00', end: '00:00', active: false },
      },
    },
  })

  console.log('✅ Lojas criadas')

  // Criar serviços para o salão
  const services1 = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Corte Feminino',
        description: 'Corte de cabelo feminino com lavagem e finalização',
        price: 80.00, // R$ 80,00
        duration: 90, // 90 minutos
        storeId: store1.id,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Manicure',
        description: 'Manicure completa com esmaltação',
        price: 35.00, // R$ 35,00
        duration: 60, // 60 minutos
        storeId: store1.id,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Pedicure',
        description: 'Pedicure completa com esmaltação',
        price: 40.00, // R$ 40,00
        duration: 60, // 60 minutos
        storeId: store1.id,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Escova Progressiva',
        description: 'Escova progressiva para alisamento natural',
        price: 150.00, // R$ 150,00
        duration: 180, // 3 horas
        storeId: store1.id,
        active: true,
      },
    }),
  ])

  // Criar serviços para a oficina
  const services2 = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Troca de Óleo',
        description: 'Troca de óleo do motor com filtro',
        price: 120.00, // R$ 120,00
        duration: 30, // 30 minutos
        storeId: store2.id,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Alinhamento e Balanceamento',
        description: 'Alinhamento e balanceamento das rodas',
        price: 80.00, // R$ 80,00
        duration: 60, // 60 minutos
        storeId: store2.id,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Revisão Completa',
        description: 'Revisão completa do veículo com diagnóstico',
        price: 250.00, // R$ 250,00
        duration: 120, // 2 horas
        storeId: store2.id,
        active: true,
      },
    }),
  ])

  console.log('✅ Serviços criados')

  // Criar alguns agendamentos de exemplo
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  dayAfterTomorrow.setHours(14, 0, 0, 0)

  await Promise.all([
    prisma.appointment.create({
      data: {
        storeId: store1.id,
        serviceId: services1[0].id,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '',
        clientEmail: client.email,
        date: tomorrow,
        startTime: '10:00',
        endTime: '11:30',
        status: 'CONFIRMED',
        notes: 'Cliente preferencial',
      },
    }),
    prisma.appointment.create({
      data: {
        storeId: store2.id,
        serviceId: services2[0].id,
        clientName: 'Carlos Oliveira',
        clientPhone: '(11) 99999-4444',
        clientEmail: 'carlos@email.com',
        date: dayAfterTomorrow,
        startTime: '14:00',
        endTime: '14:30',
        status: 'PENDING',
        notes: 'Carro: Honda Civic 2020',
      },
    }),
  ])

  console.log('✅ Agendamentos criados')

  // Criar planos
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: 'Básico',
        description: 'Ideal para pequenos negócios que estão começando',
        price: 29.90,
        interval: 'month',
        maxStores: 1,
        maxServices: 5,
        maxAppointments: 50,
        features: [
          'Agendamento online',
          'Notificações por WhatsApp',
          'Relatórios básicos',
          'Suporte por email'
        ],
        active: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Profissional',
        description: 'Para negócios em crescimento que precisam de mais recursos',
        price: 59.90,
        interval: 'month',
        maxStores: 3,
        maxServices: 20,
        maxAppointments: 200,
        features: [
          'Tudo do plano Básico',
          'Múltiplas lojas',
          'Relatórios avançados',
          'Integração com calendário',
          'Suporte prioritário',
          'Personalização de cores'
        ],
        active: true,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Empresarial',
        description: 'Para grandes empresas com necessidades avançadas',
        price: 99.90,
        interval: 'month',
        maxStores: -1, // Ilimitado
        maxServices: -1, // Ilimitado
        maxAppointments: -1, // Ilimitado
        features: [
          'Tudo do plano Profissional',
          'Lojas ilimitadas',
          'Serviços ilimitados',
          'Agendamentos ilimitados',
          'API para integrações',
          'Suporte 24/7',
          'Backup automático',
          'Relatórios personalizados'
        ],
        active: true,
      },
    }),
  ])

  console.log('✅ Planos criados')

  // Criar configurações do sistema
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'SITE_NAME' },
      update: { value: 'AgendaFácil' },
      create: {
        key: 'SITE_NAME',
        value: 'AgendaFácil',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'SITE_DESCRIPTION' },
      update: { value: 'Plataforma completa para agendamento de serviços' },
      create: {
        key: 'SITE_DESCRIPTION',
        value: 'Plataforma completa para agendamento de serviços',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'CONTACT_EMAIL' },
      update: { value: 'contato@agendafacil.com' },
      create: {
        key: 'CONTACT_EMAIL',
        value: 'contato@agendafacil.com',
      },
    }),
    prisma.systemConfig.upsert({
      where: { key: 'CONTACT_PHONE' },
      update: { value: '(11) 99999-0000' },
      create: {
        key: 'CONTACT_PHONE',
        value: '(11) 99999-0000',
      },
    }),
  ])

  console.log('✅ Configurações do sistema criadas')
  console.log('🎉 Seed concluído com sucesso!')
  
  console.log('\n📋 Dados criados:')
  console.log('👤 Usuários:')
  console.log('   - Admin: admin@agendafacil.com / 123456')
  console.log('   - Lojista: loja@agendafacil.com / 123456')
  console.log('   - Cliente: cliente@agendafacil.com / 123456')
  console.log('\n🏪 Lojas:')
  console.log('   - Salão Beleza Total (Beleza e Estética)')
  console.log('   - Auto Center Premium (Serviços Automotivos)')
  console.log('\n📅 Agendamentos de exemplo criados')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })