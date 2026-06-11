package com.swappable.backend.user;

import com.swappable.backend.dto.UserUpdateDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateUserProfile(Integer userId, UserUpdateDto updateDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBio(updateDto.bio());
        user.setLocation(updateDto.location());
        user.setDisplayName(updateDto.displayName());

        userRepository.save(user);
    }
}