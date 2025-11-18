package com.utec.backend.service;

import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import com.utec.backend.security.Permission;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PermissionService permissionService;

    private static final String PERMISSION_PREFIX = "PERMISSION_";
    private static final String ROLE_PREFIX = "ROLE_";

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        // Para usuarios OAuth, la contraseña puede ser null
        String password = usuario.getPassword();
        if (password == null) {
            password = ""; // Usuario OAuth sin contraseña
        }

        // Crear lista de autoridades: rol + permisos
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        // Agregar rol como autoridad
        authorities.add(new SimpleGrantedAuthority(ROLE_PREFIX + usuario.getRolApp().name()));

        // Agregar permisos del rol como autoridades
        Set<Permission> permissions = permissionService.getPermissionsForRole(usuario.getRolApp());
        for (Permission permission : permissions) {
            authorities.add(new SimpleGrantedAuthority(PERMISSION_PREFIX + permission.getValue()));
        }
        
        return new User(
                usuario.getEmail(),
                password,
                authorities
        );
    }
}
