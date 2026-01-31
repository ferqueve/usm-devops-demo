package com.utec.backend.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de MinIO para almacenamiento de objetos
 */
@Slf4j
@Configuration
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.region}")
    private String region;

    @Value("${minio.enabled:false}")
    private boolean minioEnabled;

    @Bean
    public MinioClient minioClient() {
        if (!minioEnabled) {
            log.warn("MinIO is DISABLED. File storage functionality will not be available.");
            log.warn("To enable MinIO, set minio.enabled=true and configure connection settings.");
            return null;
        }

        try {
            MinioClient client = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Inicializar bucket si no existe
            initializeBucket(client);

            log.info("MinIO client configurado correctamente. Endpoint: {}", endpoint);
            return client;
        } catch (Exception e) {
            log.error("Error al configurar MinIO client: {}", e.getMessage());
            log.warn("MinIO will be DISABLED. File storage functionality will not be available.");
            return null;
        }
    }

    private void initializeBucket(MinioClient client) {
        try {
            // Verificar si el bucket existe
            boolean found = client.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!found) {
                // Crear el bucket si no existe
                client.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .region(region)
                        .build());
                log.info("Bucket '{}' creado exitosamente", bucketName);

                // Configurar política de acceso público para lectura
                // Esto permite que las imágenes sean accesibles públicamente
                String policy = """
                    {
                      "Version": "2012-10-17",
                      "Statement": [
                        {
                          "Effect": "Allow",
                          "Principal": {"AWS": ["*"]},
                          "Action": ["s3:GetObject"],
                          "Resource": ["arn:aws:s3:::%s/*"]
                        }
                      ]
                    }
                    """.formatted(bucketName);

                client.setBucketPolicy(SetBucketPolicyArgs.builder()
                        .bucket(bucketName)
                        .config(policy)
                        .build());
                log.info("Política de acceso público configurada para el bucket '{}'", bucketName);
            } else {
                log.info("Bucket '{}' ya existe", bucketName);
            }
        } catch (Exception e) {
            log.error("Error al inicializar bucket '{}'", bucketName, e);
            throw new RuntimeException("No se pudo inicializar el bucket de MinIO", e);
        }
    }
}

