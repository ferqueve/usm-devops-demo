# Etapa de dependencias - Solo para cache
FROM maven:3.9.6-eclipse-temurin-21 AS dependencies
WORKDIR /app
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
RUN mvn dependency:go-offline -B

# Etapa de build
FROM maven:3.9.6-eclipse-temurin-21 AS build
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
FROM eclipse-temurin:21-jdk AS runtime
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
