package com.utec.backend.service;

import com.utec.backend.dto.recurso.RecursoResponseDto;
import com.utec.backend.exception.RecursoNoEncontradoException;
import com.utec.backend.model.Materia;
import com.utec.backend.model.RecursoAcademico;
import com.utec.backend.model.Usuario;
import com.utec.backend.repository.RecursoAcademicoRepository;
import com.utec.backend.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RecursoAcademicoService {

    private static final String TIPO_ARCHIVO = "ARCHIVO";
    private static final String TIPO_ENLACE = "ENLACE";
    private static final String RECURSO_NO_ENCONTRADO_MSG = "Recurso no encontrado con ID: ";
    private static final String USUARIO_NO_ENCONTRADO_MSG = "Usuario no encontrado: ";
    private static final int PDF_BYTES_POR_PAGINA = 50000;

    private final RecursoAcademicoRepository recursoRepository;
    private final UsuarioRepository usuarioRepository;
    private final FileStorageService fileStorageService;
    private final EntityManager entityManager;

    /**
     * Crea un recurso de tipo ARCHIVO subiendo el archivo a MinIO.
     */
    public RecursoResponseDto crearArchivo(Long materiaId, MultipartFile file, String titulo,
                                           String descripcion, String emailUsuario) throws IOException {
        Usuario usuario = obtenerUsuario(emailUsuario);

        String objectName = fileStorageService.uploadDocumento(file, materiaId);

        RecursoAcademico recurso = new RecursoAcademico();
        recurso.setMateria(entityManager.getReference(Materia.class, materiaId));
        recurso.setSubidoPor(usuario);
        recurso.setTitulo(titulo);
        recurso.setDescripcion(descripcion);
        recurso.setTipo(TIPO_ARCHIVO);
        recurso.setUrlOObjectName(objectName);
        recurso.setMimeType(file.getContentType());
        recurso.setTamanoBytes(file.getSize());
        recurso.setPaginasEstimadas(estimarPaginas(file));

        RecursoAcademico saved = recursoRepository.save(recurso);
        return mapToResponseDto(saved);
    }

    /**
     * Crea un recurso de tipo ENLACE (URL externa).
     */
    public RecursoResponseDto crearEnlace(Long materiaId, String titulo, String descripcion,
                                          String url, String emailUsuario) {
        Usuario usuario = obtenerUsuario(emailUsuario);

        RecursoAcademico recurso = new RecursoAcademico();
        recurso.setMateria(entityManager.getReference(Materia.class, materiaId));
        recurso.setSubidoPor(usuario);
        recurso.setTitulo(titulo);
        recurso.setDescripcion(descripcion);
        recurso.setTipo(TIPO_ENLACE);
        recurso.setUrlOObjectName(url);

        RecursoAcademico saved = recursoRepository.save(recurso);
        return mapToResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RecursoResponseDto> listarPorMateria(Long materiaId) {
        return recursoRepository.findByMateriaIdAndDeletedAtIsNull(materiaId).stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    /**
     * Elimina (soft delete) un recurso. Un DOCENTE solo puede eliminar los recursos
     * que él mismo subió; otros roles con permiso pueden eliminar cualquiera.
     */
    public void eliminar(Long id, String emailUsuario) {
        RecursoAcademico recurso = recursoRepository.findById(id)
                .filter(r -> r.getDeletedAt() == null)
                .orElseThrow(() -> new RecursoNoEncontradoException(RECURSO_NO_ENCONTRADO_MSG + id));

        Usuario usuario = obtenerUsuario(emailUsuario);

        if (usuario.getRolApp() == Usuario.RolApp.DOCENTE) {
            Usuario subidoPor = recurso.getSubidoPor();
            if (subidoPor == null || !subidoPor.getId().equals(usuario.getId())) {
                throw new IllegalStateException("Solo puedes eliminar los recursos que tú subiste");
            }
        }

        recurso.setDeletedAt(Instant.now());
        recursoRepository.save(recurso);
    }

    private Usuario obtenerUsuario(String emailUsuario) {
        return usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(USUARIO_NO_ENCONTRADO_MSG + emailUsuario));
    }

    /**
     * Estima páginas para PDFs en base al tamaño (~50KB/página). Null para otros tipos.
     */
    private Integer estimarPaginas(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("application/pdf")) {
            return null;
        }
        long size = file.getSize();
        if (size <= 0) {
            return 1;
        }
        return (int) Math.ceil((double) size / PDF_BYTES_POR_PAGINA);
    }

    private RecursoResponseDto mapToResponseDto(RecursoAcademico recurso) {
        RecursoResponseDto dto = new RecursoResponseDto();
        dto.setId(recurso.getId());
        dto.setMateriaId(recurso.getMateria() != null ? recurso.getMateria().getId() : null);
        dto.setTitulo(recurso.getTitulo());
        dto.setDescripcion(recurso.getDescripcion());
        dto.setTipo(recurso.getTipo());

        // URL pública: si es ENLACE, la URL almacenada tal cual; si es ARCHIVO, la URL pública del objeto en MinIO
        if (TIPO_ENLACE.equals(recurso.getTipo())) {
            dto.setUrl(recurso.getUrlOObjectName());
        } else {
            dto.setUrl(fileStorageService.getImageUrl(recurso.getUrlOObjectName()));
        }

        dto.setMimeType(recurso.getMimeType());
        dto.setTamanoBytes(recurso.getTamanoBytes());
        dto.setPaginasEstimadas(recurso.getPaginasEstimadas());
        dto.setSubidoPorNombre(recurso.getSubidoPor() != null ? recurso.getSubidoPor().getNombre() : null);
        dto.setCreatedAt(recurso.getCreatedAt());
        return dto;
    }
}
