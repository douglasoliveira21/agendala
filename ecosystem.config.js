module.exports = {
  apps: [
    {
      name: 'agendamento',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/agendamento',
      instances: 'max', // ou um número específico como 2
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Logs
      log_file: '/var/log/agendamento/combined.log',
      out_file: '/var/log/agendamento/out.log',
      error_file: '/var/log/agendamento/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart policy
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next'],
      max_memory_restart: '1G',
      
      // Advanced features
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Health check
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'SEU_IP_VPS',
      ref: 'origin/main',
      repo: 'https://github.com/seu-usuario/seu-repo.git',
      path: '/var/www/agendamento',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}