# Dockerfile para desarrollo del frontend de UTEC Space Manager
FROM node:20-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias PRIMERO (para cache)
COPY package*.json ./

# Instalar todas las dependencias (esta capa se cachea si package.json no cambia)
RUN npm ci --frozen-lockfile

# Argumento para invalidar cache cuando hay cambios de código
ARG VCS_REF=unknown
RUN echo "Building from commit: $VCS_REF"

# Copiar código fuente (esta capa se invalida con cada cambio)
COPY . .

# Exponer puerto 5173 (puerto por defecto de Vite)
EXPOSE 5173

# Comando para desarrollo - las variables vienen del docker-compose
CMD ["npm", "run", "dev:network"]
