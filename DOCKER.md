# Docker Deployment Guide

Este guia fornece instruções para executar o WhatsApp Multi-Tenant Microservice usando Docker e Docker Compose.

## Pré-requisitos

- Docker 20.10+ instalado
- Docker Compose 2.0+ instalado
- Arquivo `.env` configurado (copie de `.env.example`)

## Arquitetura Docker

O sistema é composto por 3 serviços containerizados:

```
┌─────────────────────────────────────────────────────────┐
│                   whatsapp-network                       │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Redis     │  │   Baileys    │  │   Backend     │  │
│  │   :6379     │  │   :3001      │  │   :5000       │  │
│  │             │  │              │  │               │  │
│  │  Cache de   │  │  WhatsApp    │  │  .NET 9 API   │  │
│  │  Sessões    │  │  Web Service │  │  + SignalR    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│         ↑                 ↑                  ↑           │
│         └─────────────────┴──────────────────┘           │
│                    Bridge Network                        │
└─────────────────────────────────────────────────────────┘
```

## Configuração

### 1. Criar arquivo .env

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:

```env
DATABASE_URL=Host=...;Password=YOUR_PASSWORD;...
JWT_SECRET_KEY=your-secret-key-min-32-chars
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
WEBHOOK_VERIFY_TOKEN=your-webhook-token
```

### 2. Build dos containers

```bash
docker-compose build
```

### 3. Iniciar os serviços

```bash
docker-compose up -d
```

## Serviços Disponíveis

### Redis Cache
- **Porta**: 6379
- **Uso**: Cache de sessões WhatsApp (TTL: 2-10min)
- **Política**: `allkeys-lru` com limite de 256MB
- **Persistência**: Volume `redis_data`

### Baileys Service
- **Porta**: 3001
- **Health Check**: `http://localhost:3001/health`
- **Uso**: Gerenciamento de conexões WhatsApp Web
- **Persistência**: Volume `baileys_sessions`

### Backend API
- **Porta**: 5000
- **Health Check**: `http://localhost:5000/health`
- **Swagger**: `http://localhost:5000/scalar/v1`
- **SignalR Hub**: `ws://localhost:5000/hubs/messages`

## Comandos Úteis

### Ver logs em tempo real

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f baileys
docker-compose logs -f redis
```

### Verificar status dos containers

```bash
docker-compose ps
```

### Parar os serviços

```bash
docker-compose down
```

### Parar e remover volumes (ATENÇÃO: perde dados!)

```bash
docker-compose down -v
```

### Rebuild após mudanças no código

```bash
# Rebuild tudo
docker-compose up --build -d

# Rebuild apenas um serviço
docker-compose up --build -d backend
```

### Acessar shell de um container

```bash
# Backend (.NET)
docker exec -it whatsapp-backend /bin/bash

# Baileys (Node.js)
docker exec -it whatsapp-baileys /bin/sh

# Redis CLI
docker exec -it whatsapp-redis redis-cli
```

## Health Checks

Todos os serviços possuem health checks configurados:

```bash
# Verificar health do backend
curl http://localhost:5000/health

# Verificar health do baileys
curl http://localhost:3001/health

# Verificar health do redis
docker exec -it whatsapp-redis redis-cli ping
# Resposta esperada: PONG
```

## Monitoramento Redis

### Verificar uso de memória

```bash
docker exec -it whatsapp-redis redis-cli INFO memory
```

### Ver chaves em cache

```bash
docker exec -it whatsapp-redis redis-cli KEYS "*"
```

### Limpar cache (desenvolvimento)

```bash
docker exec -it whatsapp-redis redis-cli FLUSHALL
```

## Volumes Persistentes

Os seguintes volumes são criados para persistência de dados:

- **redis_data**: Dados do Redis (cache persistente)
- **baileys_sessions**: Sessões autenticadas do WhatsApp Web

### Backup de volumes

```bash
# Backup das sessões do Baileys
docker run --rm -v whatsapp-microservice_baileys_sessions:/data -v $(pwd):/backup alpine tar czf /backup/baileys_sessions_backup.tar.gz -C /data .

# Restaurar sessões do Baileys
docker run --rm -v whatsapp-microservice_baileys_sessions:/data -v $(pwd):/backup alpine tar xzf /backup/baileys_sessions_backup.tar.gz -C /data
```

## Troubleshooting

### Backend não conecta ao Redis

**Sintoma**: Health check do backend retorna "Degraded" para Redis

**Solução**:
```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Verificar logs do Redis
docker-compose logs redis

# Reiniciar Redis
docker-compose restart redis
```

### Baileys não responde

**Sintoma**: Backend retorna erro "Baileys service unavailable"

**Solução**:
```bash
# Verificar logs do Baileys
docker-compose logs baileys

# Limpar sessões corrompidas
docker volume rm whatsapp-microservice_baileys_sessions
docker-compose up -d baileys
```

### Erro de permissão em volumes

**Solução**:
```bash
# Dar permissões corretas aos volumes
sudo chown -R 1001:1001 volumes/baileys_sessions
```

### Containers reiniciando continuamente

**Solução**:
```bash
# Ver logs detalhados
docker-compose logs --tail=100 <service-name>

# Verificar health checks
docker inspect <container-id> | grep -A 10 Health
```

## Produção

### Recomendações para deploy em produção:

1. **Use secrets do Docker Swarm ou Kubernetes** para variáveis sensíveis
2. **Configure SSL/TLS** com Nginx reverse proxy
3. **Monitore métricas** com Prometheus + Grafana
4. **Configure backup automático** dos volumes
5. **Use Redis Cluster** para alta disponibilidade
6. **Escale horizontalmente** o Baileys service conforme necessário

### Exemplo de Nginx reverse proxy:

```nginx
upstream backend {
    server backend:5000;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## CI/CD

### Exemplo de GitHub Actions:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose build

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker-compose push

      - name: Deploy to production
        run: |
          ssh user@production-server 'cd /app && docker-compose pull && docker-compose up -d'
```

## Referências

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Redis Docker Official Image](https://hub.docker.com/_/redis)
- [.NET Docker Official Images](https://hub.docker.com/_/microsoft-dotnet-aspnet)
- [Node.js Docker Official Image](https://hub.docker.com/_/node)
