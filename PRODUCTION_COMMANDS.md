# 🛠️ Comandos Úteis para Produção

Este arquivo contém comandos úteis para gerenciar seu sistema em produção na VPS Ubuntu.

## 📊 Monitoramento

### PM2 (Gerenciador de Processos)
```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs agendamento

# Ver logs específicos
pm2 logs agendamento --lines 100

# Reiniciar aplicação
pm2 restart agendamento

# Parar aplicação
pm2 stop agendamento

# Iniciar aplicação
pm2 start agendamento

# Recarregar aplicação (zero downtime)
pm2 reload agendamento

# Ver informações detalhadas
pm2 describe agendamento

# Ver uso de CPU e memória
pm2 monit
```

### Sistema
```bash
# Ver uso de disco
df -h

# Ver uso de memória
free -h

# Ver processos que mais consomem CPU
top

# Ver processos que mais consomem memória
htop

# Ver status dos serviços
sudo systemctl status nginx
sudo systemctl status postgresql
```

## 🗄️ Banco de Dados

### PostgreSQL
```bash
# Conectar ao banco
psql -h localhost -U agendamento_user -d agendamento_db

# Fazer backup
pg_dump -h localhost -U agendamento_user agendamento_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -h localhost -U agendamento_user -d agendamento_db < backup_20240101_120000.sql

# Ver tamanho do banco
psql -h localhost -U agendamento_user -d agendamento_db -c "SELECT pg_size_pretty(pg_database_size('agendamento_db'));"

# Ver tabelas e tamanhos
psql -h localhost -U agendamento_user -d agendamento_db -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname='public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Prisma
```bash
# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# Ver status das migrações
npx prisma migrate status

# Abrir Prisma Studio (cuidado em produção)
npx prisma studio

# Reset do banco (CUIDADO!)
npx prisma migrate reset --force
```

## 🌐 Nginx

### Comandos básicos
```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/access.log

# Ver logs específicos do site
sudo tail -f /var/log/nginx/agendamento_error.log
sudo tail -f /var/log/nginx/agendamento_access.log
```

## 🔒 SSL/HTTPS

### Let's Encrypt
```bash
# Renovar certificados
sudo certbot renew

# Renovar certificados (dry run)
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates

# Revogar certificado
sudo certbot revoke --cert-path /etc/letsencrypt/live/seudominio.com/cert.pem
```

## 📁 Arquivos e Logs

### Logs da aplicação
```bash
# Ver logs da aplicação
tail -f /var/log/agendamento/combined.log
tail -f /var/log/agendamento/error.log
tail -f /var/log/agendamento/out.log

# Limpar logs antigos
sudo find /var/log/agendamento -name "*.log" -mtime +30 -delete
```

### Uploads e arquivos
```bash
# Ver tamanho da pasta de uploads
du -sh /var/www/agendamento/public/uploads

# Limpar uploads antigos (cuidado!)
find /var/www/agendamento/public/uploads -mtime +90 -type f -delete

# Fazer backup dos uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/agendamento/public/uploads
```

## 🔄 Deploy e Atualizações

### Atualizar aplicação
```bash
cd /var/www/agendamento

# Fazer backup antes da atualização
pg_dump -h localhost -U agendamento_user agendamento_db > backup_pre_update_$(date +%Y%m%d_%H%M%S).sql

# Puxar código atualizado (se usando Git)
git pull origin main

# Instalar novas dependências
npm install

# Executar migrações
npx prisma migrate deploy

# Fazer build
npm run build

# Reiniciar aplicação
pm2 restart agendamento

# Verificar se está funcionando
pm2 logs agendamento
curl -I https://seudominio.com
```

### Rollback em caso de problema
```bash
# Voltar para commit anterior (Git)
git reset --hard HEAD~1

# Restaurar backup do banco
psql -h localhost -U agendamento_user -d agendamento_db < backup_pre_update_20240101_120000.sql

# Rebuild e restart
npm run build
pm2 restart agendamento
```

## 🔧 Manutenção

### Limpeza do sistema
```bash
# Limpar cache do npm
npm cache clean --force

# Limpar logs antigos
sudo journalctl --vacuum-time=30d

# Limpar arquivos temporários
sudo apt autoremove
sudo apt autoclean

# Atualizar sistema
sudo apt update && sudo apt upgrade
```

### Backup completo
```bash
#!/bin/bash
# Script de backup completo

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/$DATE"

mkdir -p $BACKUP_DIR

# Backup do banco
pg_dump -h localhost -U agendamento_user agendamento_db > $BACKUP_DIR/database.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads.tar.gz /var/www/agendamento/public/uploads

# Backup da configuração
cp /var/www/agendamento/.env $BACKUP_DIR/
cp /etc/nginx/sites-available/agendamento $BACKUP_DIR/nginx.conf

echo "Backup completo salvo em: $BACKUP_DIR"
```

## 🚨 Troubleshooting

### Aplicação não responde
```bash
# Verificar se o processo está rodando
pm2 status

# Ver logs de erro
pm2 logs agendamento --err

# Reiniciar aplicação
pm2 restart agendamento

# Se não resolver, reiniciar PM2
pm2 kill
pm2 start ecosystem.config.js --env production
```

### Erro 502 Bad Gateway
```bash
# Verificar se a aplicação está rodando na porta 3000
netstat -tlnp | grep :3000

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar conexão local
curl http://localhost:3000
```

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U agendamento_user -d agendamento_db

# Ver logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Espaço em disco cheio
```bash
# Ver uso de disco
df -h

# Encontrar arquivos grandes
sudo find / -type f -size +100M -exec ls -lh {} \;

# Limpar logs antigos
sudo journalctl --vacuum-size=100M
sudo find /var/log -name "*.log" -mtime +7 -delete
```

## 📞 Contatos de Emergência

- **Provedor VPS**: [contato do provedor]
- **Domínio**: [registrar do domínio]
- **Desenvolvedor**: [seu contato]

---

**⚠️ Importante**: Sempre faça backup antes de executar comandos que podem afetar dados!