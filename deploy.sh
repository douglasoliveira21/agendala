#!/bin/bash

# Script de Deploy para VPS Ubuntu
# Execute este script na sua VPS Ubuntu

set -e

echo "🚀 Iniciando deploy do sistema de agendamento..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   print_error "Este script não deve ser executado como root"
   exit 1
fi

# Atualizar sistema
print_status "Atualizando sistema Ubuntu..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20.x
print_status "Instalando Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
print_status "Instalando PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Instalar PM2 globalmente
print_status "Instalando PM2..."
sudo npm install -g pm2

# Instalar Nginx
print_status "Instalando Nginx..."
sudo apt install -y nginx

# Configurar PostgreSQL
print_status "Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE agendamento_db;"
sudo -u postgres psql -c "CREATE USER agendamento_user WITH ENCRYPTED PASSWORD 'sua_senha_segura_aqui';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE agendamento_db TO agendamento_user;"
sudo -u postgres psql -c "ALTER USER agendamento_user CREATEDB;"

# Criar diretório da aplicação
print_status "Criando diretório da aplicação..."
sudo mkdir -p /var/www/agendamento
sudo chown $USER:$USER /var/www/agendamento

# Clonar ou copiar aplicação (ajuste conforme necessário)
print_status "Preparando aplicação..."
cd /var/www/agendamento

# Se você tem o código em um repositório Git:
# git clone https://github.com/seu-usuario/seu-repo.git .

# Instalar dependências
print_status "Instalando dependências..."
npm install

# Configurar variáveis de ambiente
print_status "Configurando variáveis de ambiente..."
cp .env.production .env

# Executar migrações do Prisma
print_status "Executando migrações do banco de dados..."
npx prisma generate
npx prisma migrate deploy

# Build da aplicação
print_status "Fazendo build da aplicação..."
npm run build

# Configurar PM2
print_status "Configurando PM2..."
pm2 start npm --name "agendamento" -- start
pm2 startup
pm2 save

print_status "✅ Deploy concluído com sucesso!"
print_warning "Próximos passos:"
echo "1. Configure o Nginx (veja nginx.conf)"
echo "2. Configure SSL com Let's Encrypt"
echo "3. Ajuste as variáveis de ambiente em .env"
echo "4. Migre os dados do SQLite para PostgreSQL"