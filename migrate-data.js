const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

// Configuração para SQLite (origem)
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})

// Configuração para PostgreSQL (destino)
const postgresqlPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://agendamento_user:sua_senha_segura_aqui@localhost:5432/agendamento_db?schema=public'
    }
  }
})

async function migrateData() {
  console.log('🔄 Iniciando migração de dados do SQLite para PostgreSQL...')

  try {
    // 1. Migrar usuários
    console.log('📊 Migrando usuários...')
    const users = await sqlitePrisma.user.findMany()
    for (const user of users) {
      await postgresqlPrisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user
      })
    }
    console.log(`✅ ${users.length} usuários migrados`)

    // 2. Migrar empresas
    console.log('📊 Migrando empresas...')
    const companies = await sqlitePrisma.company.findMany()
    for (const company of companies) {
      await postgresqlPrisma.company.upsert({
        where: { id: company.id },
        update: company,
        create: company
      })
    }
    console.log(`✅ ${companies.length} empresas migradas`)

    // 3. Migrar lojas
    console.log('📊 Migrando lojas...')
    const stores = await sqlitePrisma.store.findMany()
    for (const store of stores) {
      await postgresqlPrisma.store.upsert({
        where: { id: store.id },
        update: store,
        create: store
      })
    }
    console.log(`✅ ${stores.length} lojas migradas`)

    // 4. Migrar serviços
    console.log('📊 Migrando serviços...')
    const services = await sqlitePrisma.service.findMany()
    for (const service of services) {
      await postgresqlPrisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service
      })
    }
    console.log(`✅ ${services.length} serviços migrados`)

    // 5. Migrar agendamentos
    console.log('📊 Migrando agendamentos...')
    const appointments = await sqlitePrisma.appointment.findMany()
    for (const appointment of appointments) {
      await postgresqlPrisma.appointment.upsert({
        where: { id: appointment.id },
        update: appointment,
        create: appointment
      })
    }
    console.log(`✅ ${appointments.length} agendamentos migrados`)

    // 6. Migrar categorias
    console.log('📊 Migrando categorias...')
    const categories = await sqlitePrisma.category.findMany()
    for (const category of categories) {
      await postgresqlPrisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      })
    }
    console.log(`✅ ${categories.length} categorias migradas`)

    // 7. Migrar avaliações
    console.log('📊 Migrando avaliações...')
    const reviews = await sqlitePrisma.review.findMany()
    for (const review of reviews) {
      await postgresqlPrisma.review.upsert({
        where: { id: review.id },
        update: review,
        create: review
      })
    }
    console.log(`✅ ${reviews.length} avaliações migradas`)

    // 8. Migrar cupons
    console.log('📊 Migrando cupons...')
    const coupons = await sqlitePrisma.coupon.findMany()
    for (const coupon of coupons) {
      await postgresqlPrisma.coupon.upsert({
        where: { id: coupon.id },
        update: coupon,
        create: coupon
      })
    }
    console.log(`✅ ${coupons.length} cupons migrados`)

    // 9. Migrar notificações
    console.log('📊 Migrando notificações...')
    const notifications = await sqlitePrisma.notification.findMany()
    for (const notification of notifications) {
      await postgresqlPrisma.notification.upsert({
        where: { id: notification.id },
        update: notification,
        create: notification
      })
    }
    console.log(`✅ ${notifications.length} notificações migradas`)

    console.log('🎉 Migração concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante a migração:', error)
    throw error
  } finally {
    await sqlitePrisma.$disconnect()
    await postgresqlPrisma.$disconnect()
  }
}

// Executar migração
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('✅ Script de migração finalizado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Falha na migração:', error)
      process.exit(1)
    })
}

module.exports = { migrateData }