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

# Exponer puerto 5173 (puerto por defecto de Vite)
EXPOSE 5173

# Comando para desarrollo - las variables vienen del docker-compose
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
