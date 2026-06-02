package com.swappable.backend.controller;

import com.swappable.backend.user.UserService;
import com.swappable.backend.dto.UserUpdateDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final com.swappable.backend.user.UserService userService;

    public UserController(com.swappable.backend.user.UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<String> updateProfile(@PathVariable Long id, @RequestBody UserUpdateDto updateDto) {
        userService.updateUserProfile(id, updateDto);
        return ResponseEntity.ok("Profile updated successfully!");
    }
}