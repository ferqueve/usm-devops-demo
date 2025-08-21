package com.utec.backend.validation;

import com.utec.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ValidationService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public boolean isEmailUnique(String email) {
        return !usuarioRepository.existsByEmail(email);
    }

    public boolean isPasswordStrong(String password) {
        // Al menos 6 caracteres, una mayúscula, una minúscula y un número
        return password != null && 
               password.length() >= 6 && 
               password.matches(".*[A-Z].*") && 
               password.matches(".*[a-z].*") && 
               password.matches(".*\\d.*");
    }

    public boolean isValidRole(String role) {
        try {
            com.utec.backend.model.Usuario.RolApp.valueOf(role);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
