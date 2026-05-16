package com.swappable.backend.controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public String health() {
        return "Backend is running";
    }

    //practicing how to add an endpoint to ensure routing works locally
    @GetMapping("/info")
    public String getServerInfo() { ; //added opening brace
        return "Status: ONLINE, Database: PostgreSQL Connected, Developer: Hazel";
    }
}
