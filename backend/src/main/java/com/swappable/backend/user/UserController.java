package com.swappable.backend.user;

import com.swappable.backend.auth.dto.MeResponse;
import com.swappable.backend.auth.dto.UpdateProfileRequest;
import com.swappable.backend.auth.AuthUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public MeResponse getMe() {
        return toResponse(loadCurrentUser());
    }

    @PutMapping("/me")
    public MeResponse updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        User user = loadCurrentUser();
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
            }
            user.setUsername(request.username());
        }
        if (request.location() != null)    user.setLocation(request.location());
        if (request.phoneNumber() != null) user.setPhoneNumber(request.phoneNumber());
        userRepository.save(user);
        return toResponse(user);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMyAccount() {
        User user = loadCurrentUser();
        userRepository.delete(user);
    }

    private User loadCurrentUser() {
        Integer id = AuthUtils.getAuthenticatedUser().getId();
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private MeResponse toResponse(User user) {
        return new MeResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getLocation(),
                user.getPhoneNumber());
    }
}
