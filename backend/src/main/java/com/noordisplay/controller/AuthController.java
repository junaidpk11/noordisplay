package com.noordisplay.controller;

import com.noordisplay.entity.User;
import com.noordisplay.repository.UserRepository;
import com.noordisplay.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil         jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        return userRepository.findByEmail(body.get("email"))
            .filter(u -> passwordEncoder.matches(body.get("password"), u.getPassword()))
            .map(u -> {
                Map<String, Object> resp = new HashMap<>();
                resp.put("token",    jwtUtil.generate(u.getEmail(), u.getRole()));
                resp.put("role",     u.getRole());
                resp.put("masjidId", u.getMasjid() != null ? u.getMasjid().getId() : "");
                resp.put("slug",     u.getMasjid() != null ? u.getMasjid().getSlug() : "");
                return ResponseEntity.ok(resp);
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }
}
