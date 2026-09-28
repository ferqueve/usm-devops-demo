# Frontend de UTEC Space Manager.
#
# Tres etapas:
#   deps    · dependencias con pnpm (la capa que se cachea)
#   dev     · servidor de Vite, para docker-compose local
#   runtime · build estático servido por nginx, para Railway
#
# Producción usa `runtime`, que es el target por defecto (la última etapa).

# ---------- dependencias ----------
FROM node:26-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- desarrollo (docker-compose) ----------
FROM node:26-alpine AS dev
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev:network"]

# ---------- build ----------
FROM node:26-alpine AS build
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite hornea las VITE_* en el bundle: tienen que existir ACÁ, no al arrancar.
# Railway las pasa como build args desde las variables del servicio.
ARG VITE_API_URL
ARG VITE_FRONTEND_URL
ARG VITE_BACKEND_URL
ARG VITE_APP_TIMEZONE

# Sin VITE_API_URL el bundle cae al fallback localhost:8080 y el sitio queda
# roto en silencio. Preferimos que reviente el build.
RUN test -n "$VITE_API_URL" || { \
      echo "ERROR: falta VITE_API_URL en el build del frontend."; \
      echo "En Railway se define como variable del servicio utec-frontend."; \
      exit 1; \
    }

RUN pnpm build

# ---------- runtime ----------
FROM nginx:1.29-alpine AS runtime

# nginx sustituye ${PORT} en el template al arrancar (docker-entrypoint.d).
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider "http://localhost:${PORT}/healthz" || exit 1
