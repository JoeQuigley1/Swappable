package com.swappable.backend.controller;

import com.swappable.backend.dto.UserUpdateDto;
import com.swappable.backend.user.UserService; // Simplified import
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<String> updateProfile(@PathVariable Integer id, @RequestBody UserUpdateDto updateDto) {
        // Uses the variable 'id' , NOT 'Integer id'
        userService.updateUserProfile(id, updateDto);
        return ResponseEntity.ok("Profile updated successfully!");
    }
}