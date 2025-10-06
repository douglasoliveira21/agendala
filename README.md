# AgendaFácil - Sistema de Agendamento

Sistema completo de agendamento de serviços desenvolvido com Next.js, TypeScript, Prisma e MySQL. Ideal para profissionais que desejam oferecer agendamento online para seus clientes.

## 🚀 Funcionalidades

### Para Clientes
- ✅ Busca de lojas e serviços por categoria e localização
- ✅ Agendamento online de serviços
- ✅ Visualização de horários disponíveis
- ✅ Histórico de agendamentos
- ✅ Notificações por WhatsApp

### Para Lojistas
- ✅ Painel de controle completo
- ✅ Gestão de serviços e preços
- ✅ Calendário de agendamentos
- ✅ Integração com WhatsApp
- ✅ Relatórios e estatísticas
- ✅ Configuração de horários de funcionamento

### Para Administradores
- ✅ Painel master de administração
- ✅ Gestão de usuários e lojas
- ✅ Gestão de categorias
- ✅ Relatórios gerais do sistema
- ✅ Configurações globais

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Banco de Dados**: MySQL com Prisma ORM
- **Autenticação**: NextAuth.js com JWT
- **WhatsApp**: VenomBot
- **UI Components**: Radix UI, Lucide React
- **Validação**: Zod
- **Formulários**: React Hook Form

## 📋 Pré-requisitos

- Node.js 18+ 
- MySQL 8.0+
- npm ou yarn

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd agendamento
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados MySQL

Crie um banco de dados MySQL:
```sql
CREATE DATABASE agendamento_db;
CREATE USER 'agendamento_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON agendamento_db.* TO 'agendamento_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure as variáveis de ambiente

Copie o arquivo `.env` e ajuste as configurações:

```env
# Database
DATABASE_URL="mysql://agendamento_user:sua_senha_segura@localhost:3306/agendamento_db"

# NextAuth
NEXTAUTH_SECRET="seu_secret_muito_seguro_aqui"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="outro_secret_muito_seguro_para_jwt"

# WhatsApp
WHATSAPP_SESSION_PATH="./whatsapp-sessions"

# App
APP_NAME="AgendaFácil"
APP_URL="http://localhost:3000"
NODE_ENV="development"

# Email (Opcional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""

# Upload
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="5242880"
```

### 5. Execute as migrações do banco
```bash
npm run db:migrate
```

### 6. Popule o banco com dados iniciais
```bash
npm run db:seed
```

### 7. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 👥 Contas de Demonstração

Após executar o seed, você terá acesso às seguintes contas:

### Administrador
- **Email**: admin@agendafacil.com
- **Senha**: admin123
- **Acesso**: Painel administrativo completo

### Lojista
- **Email**: loja@agendafacil.com
- **Senha**: loja123
- **Acesso**: Painel do lojista

### Cliente
- **Email**: cliente@agendafacil.com
- **Senha**: cliente123
- **Acesso**: Área do cliente

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Painel do lojista
│   ├── admin/             # Painel administrativo
│   └── loja/              # Páginas públicas das lojas
├── components/            # Componentes React
│   └── ui/                # Componentes de UI
├── lib/                   # Utilitários e configurações
├── types/                 # Definições de tipos TypeScript
└── styles/                # Estilos globais

prisma/
├── schema.prisma          # Schema do banco de dados
├── migrations/            # Migrações do banco
└── seed.ts               # Script de população inicial
```

## 🗄️ Banco de Dados

O sistema utiliza as seguintes tabelas principais:

- **users**: Usuários do sistema (clientes, lojistas, admins)
- **stores**: Lojas/estabelecimentos
- **categories**: Categorias de serviços
- **services**: Serviços oferecidos pelas lojas
- **appointments**: Agendamentos
- **whatsapp_sessions**: Sessões do WhatsApp
- **whatsapp_messages**: Mensagens enviadas
- **system_configs**: Configurações do sistema

## 🔐 Autenticação e Autorização

O sistema possui três níveis de acesso:

1. **CLIENT**: Pode agendar serviços e gerenciar seus agendamentos
2. **STORE_OWNER**: Pode gerenciar sua loja, serviços e agendamentos
3. **ADMIN**: Acesso completo ao sistema

## 📱 Integração WhatsApp

O sistema integra com WhatsApp através do VenomBot para:

- Confirmação de agendamentos
- Lembretes automáticos
- Notificações de cancelamento
- Comunicação direta com clientes

### Configuração do WhatsApp

1. Acesse o painel da loja
2. Vá em "Configurações" > "WhatsApp"
3. Clique em "Conectar WhatsApp"
4. Escaneie o QR Code com seu WhatsApp
5. Aguarde a confirmação da conexão

## 🚀 Deploy em Produção

### Usando Docker (Recomendado)

1. Configure as variáveis de ambiente de produção
2. Execute as migrações no banco de produção
3. Build da aplicação:
```bash
npm run build
```

### Configurações de Produção

- Configure um banco MySQL dedicado
- Use HTTPS (certificado SSL)
- Configure backup automático do banco
- Monitore logs e performance
- Configure firewall adequado

## 📊 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build           # Build de produção
npm run start           # Inicia servidor de produção

# Banco de Dados
npm run db:migrate      # Executa migrações
npm run db:generate     # Gera cliente Prisma
npm run db:seed         # Popula banco com dados iniciais
npm run db:reset        # Reseta banco (cuidado!)
npm run db:studio       # Abre Prisma Studio

# Outros
npm run lint            # Executa linting
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:

- Email: contato@agendafacil.com
- WhatsApp: (11) 99999-0000

## 🔄 Atualizações

Para manter o sistema atualizado:

```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix
```

---

Desenvolvido com ❤️ para facilitar o agendamento de serviços.
