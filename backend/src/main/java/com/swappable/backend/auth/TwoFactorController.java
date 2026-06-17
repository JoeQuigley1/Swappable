package com.swappable.backend.auth;

import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/me/2fa")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;

    public TwoFactorController(TwoFactorService twoFactorService) {
        this.twoFactorService = twoFactorService;

    }

    // get current 2FA status
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getStatus(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("totpEnabled", user.isTotpEnabled()));
    }

    // initiate 2FA setup - returns secret and QR code URL
    @PostMapping("/setup")
    public ResponseEntity<Map<String, String>> setup(
            @AuthenticationPrincipal User user) {
        try {
            String secret = twoFactorService.setupTotp(user);
            String qrCodeUrl = twoFactorService.buildQrCodeUrl(user, secret);
            return ResponseEntity.ok(Map.of(
                    "secret", secret,
                    "qrCodeUrl", qrCodeUrl
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // confirm setup with first code from authenticator app
    @PostMapping("/verify-setup")
    public ResponseEntity<Map<String, String>> verifySetup(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String code = body.get("code");
        try {
            twoFactorService.verifySetup(user, code);
            return ResponseEntity.ok(Map.of("message", "2FA enabled"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // disable 2FA - requires password confirmation
    @DeleteMapping
    public ResponseEntity<Void> disable(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        String password = body.get("password");
        try {
            twoFactorService.disableTotp(user, password);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

}