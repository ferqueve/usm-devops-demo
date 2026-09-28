# Etapa de dependencias - Solo para cache
FROM maven:3.9.15-eclipse-temurin-26 AS dependencies
WORKDIR /app
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
RUN mvn dependency:go-offline -B

# Etapa de build
FROM maven:3.9.15-eclipse-temurin-26 AS build
WORKDIR /app

# Copiar solo pom.xml primero para cachear dependencias
COPY pom.xml .
COPY --from=dependencies /root/.m2 /root/.m2

# Argumento para invalidar cache cuando hay cambios de código
ARG VCS_REF=unknown
RUN echo "Building from commit: $VCS_REF"

# Copiar código fuente (esta capa se invalida con cada cambio)
COPY src ./src

# Compilar la aplicación
RUN mvn clean package -DskipTests

# Etapa de runtime
# JRE, no JDK: para ejecutar un jar no hace falta el compilador ni las
# herramientas de desarrollo, y la imagen baja varios cientos de MB.
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

# start-period largo: Spring + Liquibase + wake-up de PG pueden tardar.
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -fsS http://localhost:${SERVER_PORT:-8080}/actuator/health || exit 1

# El servicio venía usando 0,757 GB de RAM las 24 h — la mayor parte del costo
# del proyecto en Railway — porque la JVM dimensiona el heap contra la memoria
# que ve, y ahí ve la del host entero.
#
# El tope es absoluto y no un porcentaje a propósito: sin límite de contenedor,
# -XX:MaxRAMPercentage=70 pedía un heap de 11 GB. SerialGC evita los hilos y las
# estructuras de G1, que no aportan nada con esta carga.
#
# Railway puede pisar esto definiendo JAVA_OPTS como variable del servicio.
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseSerialGC -XX:MaxMetaspaceSize=192m -XX:+ExitOnOutOfMemoryError"
ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar app.jar"]
