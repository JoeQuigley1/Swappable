package com.swappable.backend.controller;

import com.swappable.backend.auth.dto.MeResponse;
import com.swappable.backend.auth.dto.UpdateProfileRequest;
import com.swappable.backend.auth.AuthUtils;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import com.swappable.backend.user.PublicUserResponse;
import com.swappable.backend.common.PagedResponse;
import com.swappable.backend.item.ItemMapper;
import com.swappable.backend.item.ItemRepository;
import com.swappable.backend.item.ItemResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final String ITEM_STATUS_AVAILABLE = "available";

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final ItemMapper itemMapper;

    public UserController(
            UserRepository userRepository,
            ItemRepository itemRepository,
            ItemMapper itemMapper
    ) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.itemMapper = itemMapper;
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
        userRepository.delete(loadCurrentUser());
    }

    @GetMapping("/{id}")
    public PublicUserResponse getPublicProfile(
            @PathVariable Integer id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        Page<ItemResponse> items = itemRepository
                .findByUserIdAndStatus(user.getId(), ITEM_STATUS_AVAILABLE, pageable)
                .map(itemMapper::toResponse);

        return new PublicUserResponse(
                user.getId(),
                user.getUsername(),
                user.getLocation(),
                PagedResponse.from(items));
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