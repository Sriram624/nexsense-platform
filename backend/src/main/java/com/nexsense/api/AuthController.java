package com.nexsense.api;

import com.nexsense.security.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    public AuthController(AppUserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users=users; this.encoder=encoder; this.jwt=jwt;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String,String> register(@Valid @RequestBody Credentials body) {
        String email=body.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already registered");
        users.save(new AppUser(email, encoder.encode(body.password())));
        return Map.of("token",jwt.issue(email),"email",email);
    }

    @PostMapping("/login")
    public Map<String,String> login(@Valid @RequestBody Credentials body) {
        String email=body.email().trim().toLowerCase();
        AppUser user=users.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials"));
        if (!encoder.matches(body.password(),user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid credentials");
        return Map.of("token",jwt.issue(email),"email",email);
    }

    public record Credentials(@Email @NotBlank String email,
                              @NotBlank @Size(min=10,max=72) String password) {}
}
