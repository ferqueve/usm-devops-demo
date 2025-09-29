# Dockerfile para desarrollo del frontend de UTEC Space Manager
FROM node:20-alpine

# Instalar dependencias necesarias
RUN apk add --no-cache libc6-compat

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Ejecutar script de configuración de entorno
RUN npm run setup-env

# Exponer puerto 5173 (puerto por defecto de Vite)
EXPOSE 5173

# Comando para desarrollo - configurable
CMD ["sh", "-c", "npm run ${DEV_MODE:-dev:network}"]
