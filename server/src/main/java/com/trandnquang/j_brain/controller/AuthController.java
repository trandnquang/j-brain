package com.trandnquang.j_brain.controller;

import com.trandnquang.j_brain.config.JwtUtils;
import com.trandnquang.j_brain.domain.entity.User;
import com.trandnquang.j_brain.domain.repository.UserRepository;
import com.trandnquang.j_brain.dto.request.LoginRequest;
import com.trandnquang.j_brain.dto.request.RegisterRequest;
import com.trandnquang.j_brain.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Handles credential exchange: user registration and JWT issuance on login.
 *
 * <p>
 * WHY: Auth endpoints are deliberately kept in a controller rather than a
 * dedicated service because they are pure orchestration of existing Spring
 * Security components (AuthenticationManager, PasswordEncoder, JwtUtils) with
 * no independent business logic to encapsulate.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    /**
     * Authenticates credentials and issues a signed JWT.
     *
     * @param request {@code email} + {@code password} payload.
     * @return 200 with {@link AuthResponse} containing the JWT token and user info.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(authentication.getName());

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Authenticated user not found in DB — data integrity issue"));

        return ResponseEntity.ok(AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build());
    }

    /**
     * Registers a new user account.
     *
     * @param request {@code username}, {@code email}, {@code password} payload.
     * @return 201 Created with the new user's auth token for immediate use.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        User user = userRepository.saveAndFlush(User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build());

        // Issue token immediately so the client doesn't need a second login call
        String jwt = jwtUtils.generateToken(user.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.builder()
                .token(jwt)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build());
    }
}
