package com.swappable.backend.auth;


import com.swappable.backend.auth.dto.AuthResponse;
import com.swappable.backend.auth.dto.LoginRequest;
import com.swappable.backend.auth.dto.RegisterRequest;
import com.swappable.backend.auth.dto.ForgotPasswordRequest;
import com.swappable.backend.auth.dto.ResetPasswordRequest;
import com.swappable.backend.auth.security.JwtService;
import com.swappable.backend.auth.passwordreset.PasswordResetService;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final TwoFactorService twoFactorService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService, TwoFactorService twoFactorService, UserRepository userRepository,
                          JwtService jwtService) {

        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.twoFactorService = twoFactorService;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public AuthResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);


}

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.getEmail());
        return ResponseEntity.ok().build();
        }

        @PostMapping("/reset-password")
        public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request){
            try {
                passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
                return ResponseEntity.ok().build();
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }

        }

    @PostMapping("/2fa/validate")
    public ResponseEntity<?> validate2Fa(@RequestBody Map<String, String> body) {
        String tempToken = body.get("tempToken");
        String code = body.get("code");

        if (tempToken == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing tempToken or code"));
        }

        if (!jwtService.isTempToken(tempToken)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid temp token"));
        }

        String email = jwtService.extractEmail(tempToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!twoFactorService.verifyCode(user, code)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid code"));
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                false,
                null
        ));
    }

}