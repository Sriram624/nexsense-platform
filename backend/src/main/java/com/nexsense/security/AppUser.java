package com.nexsense.security;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name="app_users", uniqueConstraints=@UniqueConstraint(columnNames="email"))
public class AppUser {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=190) private String email;
    @Column(nullable=false) private String passwordHash;
    @Column(nullable=false, length=20) private String role = "USER";
    @Column(nullable=false) private Instant createdAt = Instant.now();
    protected AppUser() {}
    public AppUser(String email, String passwordHash) { this.email=email; this.passwordHash=passwordHash; }
    public Long getId(){return id;} public String getEmail(){return email;}
    public String getPasswordHash(){return passwordHash;} public String getRole(){return role;}
}
