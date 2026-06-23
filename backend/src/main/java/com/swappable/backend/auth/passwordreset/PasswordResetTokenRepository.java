package com.swappable.backend.auth.passwordreset;

import com.swappable.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import com.swappable.backend.auth.passwordreset.PasswordResetToken;


import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser(User user);
}