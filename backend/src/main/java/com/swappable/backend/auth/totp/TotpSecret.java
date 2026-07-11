package com.swappable.backend.auth.totp;

import com.swappable.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "totp_secrets")
public class TotpSecret {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String secret;

    @Column(nullable = false)
    private boolean enabled = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public TotpSecret() {}

    public TotpSecret(User user, String secret) {
        this.user = user;
        this.secret = secret;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}