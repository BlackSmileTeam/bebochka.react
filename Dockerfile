# Build stage
FROM node:20-alpine AS build
WORKDIR /app
# Пусто = тот же origin что у сайта (рекомендуется для https://bebochka.ru). Не задавайте http://IP для продакшена.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
# DEPLOY_MODE=compose — proxy на сервис backend (docker-compose). standalone — API на хосте :55501 (см. nginx.standalone.conf).
FROM nginx:alpine
ARG DEPLOY_MODE=compose
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /tmp/nginx-compose.conf
COPY nginx.standalone.conf /tmp/nginx-standalone.conf
RUN if [ "$DEPLOY_MODE" = "standalone" ]; then \
      cp /tmp/nginx-standalone.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /tmp/nginx-compose.conf /etc/nginx/conf.d/default.conf; \
    fi && rm -f /tmp/nginx-*.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

