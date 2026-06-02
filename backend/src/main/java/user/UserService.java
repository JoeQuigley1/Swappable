package com.swappable.backend.user;

import com.swappable.backend.dto.UserUpdateDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    // Constructor links the repository so the service will use it
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void updateUserProfile(Long userId, UserUpdateDto updateDto) {
        // Finding the user or gives error if they don't exist
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Updating the fields
        user.setBio(updateDto.bio());
        user.setLocation(updateDto.location());
        user.setDisplayName(updateDto.displayName());

        // Saving changes to go back the database
        userRepository.save(user);
    }
}