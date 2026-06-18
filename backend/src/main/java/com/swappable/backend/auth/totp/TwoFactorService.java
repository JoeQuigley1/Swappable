package com.swappable.backend.auth.totp;

import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.swappable.backend.auth.totp.TotpSecret;
import com.swappable.backend.auth.totp.TotpSecretRepository;

import java.util.Optional;

@Service
public class TwoFactorService {

    private static final Logger log = LoggerFactory.getLogger(TwoFactorService.class);

    private final TotpSecretRepository totpSecretRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier codeVerifier;

    public TwoFactorService(TotpSecretRepository totpSecretRepository,
                            UserRepository userRepository,
                            PasswordEncoder passwordEncoder) {
        this.totpSecretRepository = totpSecretRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;

        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator();
        this.codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    }

    @Transactional
    public String setupTotp(User user) {
        // if already enabled, throw error
        Optional<TotpSecret> existing = totpSecretRepository.findByUser(user);
        if (existing.isPresent() && existing.get().isEnabled()) {
            throw new IllegalArgumentException("2FA is already enabled");
        }

        // generate new secret
        String secret = secretGenerator.generate();

        // save or replace pending secret
        TotpSecret totpSecret = existing.orElse(new TotpSecret(user, secret));
        totpSecret.setSecret(secret);
        totpSecret.setEnabled(false);
        totpSecretRepository.save(totpSecret);

        log.info("2FA setup initiated for user {}", user.getId());
        return secret;
    }

    @Transactional
    public void verifySetup(User user, String code) {
        TotpSecret totpSecret = totpSecretRepository.findByUser(user)
                .orElseThrow(() -> new IllegalArgumentException("2FA setup not initiated"));

        if (totpSecret.isEnabled()) {
            throw new IllegalArgumentException("2FA is already enabled");
        }

        if (!codeVerifier.isValidCode(totpSecret.getSecret(), code)) {
            throw new IllegalArgumentException("Invalid code");
        }

        totpSecret.setEnabled(true);
        totpSecretRepository.save(totpSecret);

        user.setTotpEnabled(true);
        userRepository.save(user);

        log.info("2FA enabled for user {}", user.getId());
    }

    public boolean verifyCode(User user, String code) {
        Optional<TotpSecret> totpSecret = totpSecretRepository.findByUser(user);
        if (totpSecret.isEmpty() || !totpSecret.get().isEnabled()) {
            return false;
        }
        return codeVerifier.isValidCode(totpSecret.get().getSecret(), code);
    }

    @Transactional
    public void disableTotp(User user, String password) {
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password");
        }

        totpSecretRepository.deleteByUser(user);

        user.setTotpEnabled(false);
        userRepository.save(user);

        log.info("2FA disabled for user {}", user.getId());
    }

    public String buildQrCodeUrl(User user, String secret) {
        return "otpauth://totp/Swappable:" + user.getEmail()
                + "?secret=" + secret
                + "&issuer=Swappable";
    }

    public boolean isTotpEnabled(User user) {
        return user.isTotpEnabled();
    }
}