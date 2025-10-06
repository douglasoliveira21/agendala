# 🚀 Guia de Migração para VPS Ubuntu + PostgreSQL

Este guia te ajudará a migrar seu sistema de agendamento do ambiente local (SQLite) para uma VPS Ubuntu com PostgreSQL.

## 📋 Pré-requisitos

- VPS Ubuntu 20.04+ com acesso root/sudo
- Domínio configurado apontando para sua VPS
- Acesso SSH à VPS
- Backup dos dados atuais

## 🔧 Passo 1: Preparar a VPS Ubuntu

### 1.1 Conectar à VPS
```bash
ssh root@SEU_IP_VPS
# ou
ssh ubuntu@SEU_IP_VPS
```

### 1.2 Criar usuário (se necessário)
```bash
adduser agendamento
usermod -aG sudo agendamento
su - agendamento
```

### 1.3 Executar script de instalação
```bash
# Copie o arquivo deploy.sh para a VPS
chmod +x deploy.sh
./deploy.sh
```

## 🗄️ Passo 2: Configurar PostgreSQL

### 2.1 Configurar senha do PostgreSQL
```bash
sudo -u postgres psql
\password postgres
\q
```

### 2.2 Configurar acesso remoto (opcional)
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
# Descomente e altere:
# listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Adicione:
# host    all             all             0.0.0.0/0               md5

sudo systemctl restart postgresql
```

### 2.3 Verificar conexão
```bash
psql -h localhost -U agendamento_user -d agendamento_db
```

## 📁 Passo 3: Preparar Aplicação

### 3.1 Clonar/Copiar código
```bash
cd /var/www/agendamento
# Se usando Git:
git clone https://github.com/seu-usuario/seu-repo.git .
# Ou copie os arquivos via SCP/SFTP
```

### 3.2 Instalar dependências
```bash
npm install
```

### 3.3 Configurar variáveis de ambiente
```bash
cp .env.production .env
nano .env
```

Edite as seguintes variáveis:
```env
DATABASE_URL="postgresql://agendamento_user:sua_senha_segura_aqui@localhost:5432/agendamento_db?schema=public"
NEXTAUTH_URL="https://seudominio.com"
NEXTAUTH_SECRET="gere-um-secret-seguro-de-32-caracteres"
```

### 3.4 Executar migrações
```bash
npx prisma generate
npx prisma migrate deploy
```

## 📊 Passo 4: Migrar Dados

### 4.1 Copiar banco SQLite
```bash
# Copie o arquivo prisma/dev.db do seu ambiente local para a VPS
scp prisma/dev.db usuario@SEU_IP_VPS:/var/www/agendamento/prisma/
```

### 4.2 Executar migração de dados
```bash
cd /var/www/agendamento
node migrate-data.js
```

## 🏗️ Passo 5: Build e Deploy

### 5.1 Build da aplicação
```bash
npm run build
```

### 5.2 Configurar PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save
```

### 5.3 Verificar status
```bash
pm2 status
pm2 logs agendamento
```

## 🌐 Passo 6: Configurar Nginx

### 6.1 Configurar site
```bash
sudo cp nginx.conf /etc/nginx/sites-available/agendamento
sudo ln -s /etc/nginx/sites-available/agendamento /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 6.2 Testar configuração
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6.3 Verificar funcionamento
```bash
curl http://SEU_IP_VPS
# ou acesse pelo navegador
```

## 🔒 Passo 7: Configurar SSL (Let's Encrypt)

### 7.1 Instalar Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

### 7.2 Obter certificado
```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

### 7.3 Configurar renovação automática
```bash
sudo crontab -e
# Adicione:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📝 Passo 8: Configurar Logs

### 8.1 Criar diretórios de log
```bash
sudo mkdir -p /var/log/agendamento
sudo chown agendamento:agendamento /var/log/agendamento
```

### 8.2 Configurar logrotate
```bash
sudo nano /etc/logrotate.d/agendamento
```

Conteúdo:
```
/var/log/agendamento/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 agendamento agendamento
    postrotate
        pm2 reload agendamento
    endscript
}
```

## 🔧 Passo 9: Configurações Finais

### 9.1 Configurar firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 9.2 Configurar backup automático
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-agendamento.sh
```

Conteúdo:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U agendamento_user agendamento_db > /backup/agendamento_$DATE.sql
find /backup -name "agendamento_*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-agendamento.sh
sudo crontab -e
# Adicione:
0 2 * * * /usr/local/bin/backup-agendamento.sh
```

## ✅ Verificações Finais

### 9.1 Testar aplicação
- [ ] Acesso via HTTPS funcionando
- [ ] Login de usuários funcionando
- [ ] Criação de agendamentos funcionando
- [ ] Upload de arquivos funcionando
- [ ] Notificações funcionando

### 9.2 Monitoramento
```bash
# Status dos serviços
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Logs
pm2 logs agendamento
sudo tail -f /var/log/nginx/agendamento_error.log
```

## 🆘 Troubleshooting

### Problema: Aplicação não inicia
```bash
pm2 logs agendamento
# Verificar logs de erro
```

### Problema: Erro de conexão com banco
```bash
# Testar conexão
psql -h localhost -U agendamento_user -d agendamento_db
# Verificar variáveis de ambiente
cat .env | grep DATABASE_URL
```

### Problema: Nginx não serve a aplicação
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

## 📞 Suporte

Se encontrar problemas durante a migração:

1. Verifique os logs: `pm2 logs agendamento`
2. Teste a conexão com o banco: `npx prisma db pull`
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Next.js e Prisma

---

**⚠️ Importante**: Sempre faça backup dos dados antes de iniciar a migração!