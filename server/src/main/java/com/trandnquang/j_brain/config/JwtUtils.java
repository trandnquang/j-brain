package com.trandnquang.j_brain.config;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility for generating, signing, and parsing JWT access tokens.
 * 
 * WHY: Abstracting token handling allows us to strictly enforce symmetric key
 * configuration and token lifecycle boundaries independent of MVC controllers.
 */
@Component
public class JwtUtils {

    @Value("${jwt.secret:jbrain_super_secret_key_which_must_be_long_enough_for_hs256}")
    private String secretString;

    @Value("${jwt.expiration_ms:86400000}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes = secretString.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (Exception e) {
            System.err.println("JWT Validation Error: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }
}
