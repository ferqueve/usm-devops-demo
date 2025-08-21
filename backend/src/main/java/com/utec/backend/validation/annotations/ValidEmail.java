package com.utec.backend.validation.annotations;

import com.utec.backend.validation.validators.ValidEmailValidator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidEmailValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEmail {
    String message() default "El formato del email no es válido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
