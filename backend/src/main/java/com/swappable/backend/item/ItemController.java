package com.swappable.backend.item;


import com.swappable.backend.category.Category;
import com.swappable.backend.category.CategoryRepository;
import com.swappable.backend.user.User;
import com.swappable.backend.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public ItemController(ItemRepository itemRepository, UserRepository userRepository, CategoryRepository categoryRepository) {
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<ItemResponse> getAllItems() {
        return itemRepository.findAll()
                .stream()
                .map(item -> new ItemResponse(
                        item.getId(),
                        item.getTitle(),
                        item.getDescription(),
                        item.getCondition(),
                        item.getImageUrl(),
                        item.getStatus(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation()
                ))
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Integer id) {
        return itemRepository.findById(id)
                .map(item -> new ItemResponse(
                        item.getId(),
                        item.getTitle(),
                        item.getDescription(),
                        item.getCondition(),
                        item.getImageUrl(),
                        item.getStatus(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation()
                ))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ItemResponse createItem(
            @RequestBody CreateItemRequest request
    ) {

        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow();

        Item item = new Item();

        item.setUser(user);
        item.setCategory(category);
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setCondition(request.condition());
        item.setImageUrl(request.imageUrl());
        item.setStatus("available");

        Item savedItem = itemRepository.save(item);

        return new ItemResponse(
                savedItem.getId(),
                savedItem.getTitle(),
                savedItem.getDescription(),
                savedItem.getCondition(),
                savedItem.getImageUrl(),
                savedItem.getStatus(),
                savedItem.getCategory().getName(),
                savedItem.getUser().getUsername(),
                savedItem.getUser().getLocation()
        );
    }

    @GetMapping("/my-items")
    public List<ItemResponse> getMyItems() {

        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        return itemRepository.findByUserId(user.getId())
                .stream()
                .map(item -> new ItemResponse(
                        item.getId(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation(),
                        item.getTitle(),
                        item.getDescription(),
                        item.getCondition(),
                        item.getImageUrl(),
                        item.getStatus()
                ))
                .toList();
    }
}