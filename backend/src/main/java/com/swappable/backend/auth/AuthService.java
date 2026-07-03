package com.swappable.backend.auth;

import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.swappable.backend.auth.dto.AuthResponse;
import com.swappable.backend.auth.dto.LoginRequest;
import com.swappable.backend.auth.dto.RegisterRequest;
import com.swappable.backend.auth.security.JwtService;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Register a new user
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        // Create user object
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        // Add real encoder password
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setLocation(request.location());
        user.setLatitude(request.lat());
        user.setLongitude(request.lng());

        // Save to database
        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        // Return response
        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail()
        );
    }



    // Login existing user
    public LoginResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid email or password"
                ));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        // if 2FA is enabled, return temp token instead of full JWT
        if (user.isTotpEnabled()) {
            String tempToken = jwtService.generateTempToken(user);
            return new LoginResponse(
                    null,
                    null,
                    null,
                    null,
                    true,
                    tempToken
            );
        }


        // normal login - no 2FA
        String token = jwtService.generateToken(user);
        // Return response
        return new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                false,
                null
        );
    }
}