package com.utec.backend.service;

import com.utec.backend.model.Usuario;
import com.utec.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        // Para usuarios OAuth, la contraseña puede ser null
        String password = usuario.getPassword();
        if (password == null) {
            password = ""; // Usuario OAuth sin contraseña
        }
        
        return new User(
                usuario.getEmail(),
                password,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + usuario.getRolApp().name()))
        );
    }
}
