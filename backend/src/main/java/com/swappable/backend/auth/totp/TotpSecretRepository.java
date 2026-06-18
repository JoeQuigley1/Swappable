package com.swappable.backend.auth.totp;

import com.swappable.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TotpSecretRepository extends JpaRepository<TotpSecret, Long> {

    Optional<TotpSecret> findByUser(User user);

    void deleteByUser(User user);
}