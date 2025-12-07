# Инструкции по развертыванию Frontend

## Необходимые GitHub Secrets

Добавьте следующие секреты в настройках репозитория GitHub (Settings → Secrets and variables → Actions):

**Подробная инструкция:** см. файл `GITHUB_SECRETS.md`

### Краткий список:

1. **SSH_HOST** = `89.104.67.36`
2. **SSH_USERNAME** = имя пользователя для SSH (например: `root`, `ubuntu`)
3. **SSH_PRIVATE_KEY** = приватный SSH ключ (полный ключ с BEGIN/END)
4. **SSH_PORT** = `22` (опционально)
5. **API_URL** = URL API бэкенда (опционально): `http://89.104.67.36:44315`

**Примечание:** Если `API_URL` не указан, будет использован `http://89.104.67.36:44315` по умолчанию.

## Развертывание через Docker Compose

На сервере выполните:

```bash
docker-compose up -d
```

## Ручное развертывание

### Frontend

```bash
cd .
docker build -t bebochka-frontend:latest -f Dockerfile .
docker run -d \
  --name bebochka-frontend \
  --restart unless-stopped \
  -p 80:80 \
  bebochka-frontend:latest
```

## Настройка API URL

Если API бэкенда находится на другом адресе, обновите файл `nginx.conf`:

```nginx
location /api {
    proxy_pass http://YOUR_API_HOST:44315;
    # ... остальные настройки
}
```

Или используйте переменную окружения при сборке (если настроено в Dockerfile).

## Проверка работы

- Frontend: http://89.104.67.36/
- API запросы проксируются на: http://89.104.67.36:44315/api

