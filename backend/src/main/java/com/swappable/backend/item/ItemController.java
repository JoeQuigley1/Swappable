package com.swappable.backend.item;


import com.swappable.backend.category.Category;
import com.swappable.backend.category.CategoryRepository;
import com.swappable.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final ItemImageRepository itemImageRepository;
    private final ImageService imageService;

    public ItemController(
            ItemRepository itemRepository,
            CategoryRepository categoryRepository,
            ItemImageRepository itemImageRepository,
            ImageService imageService
    ) {
        this.itemRepository = itemRepository;
        this.categoryRepository = categoryRepository;
        this.itemImageRepository = itemImageRepository;
        this.imageService = imageService;
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
                        item.getCategory().getId(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation(),
                        item.getUser().getLatitude(),
                        item.getUser().getLongitude()
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
                        item.getCategory().getId(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation(),
                        item.getUser().getLatitude(),
                        item.getUser().getLongitude()
                ))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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
                        item.getTitle(),
                        item.getDescription(),
                        item.getCondition(),
                        item.getImageUrl(),
                        item.getStatus(),
                        item.getCategory().getId(),
                        item.getCategory().getName(),
                        item.getUser().getUsername(),
                        item.getUser().getLocation(),
                        item.getUser().getLatitude(),
                        item.getUser().getLongitude()
                ))
                .toList();
    }

    @PostMapping
    public ItemResponse createItem(
           @Valid @RequestBody CreateItemRequest request
    ) {

        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Invalid CategoryId"
                        )
                );

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
                savedItem.getCategory().getId(),
                savedItem.getCategory().getName(),
                savedItem.getUser().getUsername(),
                savedItem.getUser().getLocation(),
                savedItem.getUser().getLatitude(),
                savedItem.getUser().getLongitude()
        );
    }

    @PutMapping("/{id}")
    public ItemResponse updateItem(
            @PathVariable Integer id,
            @Valid @RequestBody CreateItemRequest request
    ) {
        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item not found"
                ));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only update your own items"
            );
        }

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid CategoryId"
                ));

        item.setCategory(category);
        item.setTitle(request.title());
        item.setDescription(request.description());
        item.setCondition(request.condition());

        if (request.imageUrl() != null) {
            item.setImageUrl(request.imageUrl());
        }

        Item savedItem = itemRepository.save(item);

        return new ItemResponse(
                savedItem.getId(),
                savedItem.getTitle(),
                savedItem.getDescription(),
                savedItem.getCondition(),
                savedItem.getImageUrl(),
                savedItem.getStatus(),
                item.getCategory().getId(),
                savedItem.getCategory().getName(),
                savedItem.getUser().getUsername(),
                savedItem.getUser().getLocation(),
                savedItem.getUser().getLatitude(),
                savedItem.getUser().getLongitude()
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Integer id) {

        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item not found"
                ));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete your own items"
            );
        }

        itemRepository.delete(item);
    }

    @PostMapping("/{id}/images")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public List<ItemImageResponse> uploadImages(
            @PathVariable Integer id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        User user = (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item not found"
                ));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only add images to your own items"
            );
        }

        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No files provided"
            );
        }

        long existingCount = itemImageRepository.countByItemId(id);
        if (existingCount + files.size() > 3) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "An item can have at most 3 images"
            );
        }

        int nextOrder = (int) existingCount;
        List<ItemImageResponse> created = new ArrayList<>();

        for (MultipartFile file : files) {
            byte[] webp = imageService.toWebp(file);

            ItemImage image = new ItemImage();
            image.setItem(item);
            image.setData(webp);
            image.setContentType(ImageService.WEBP_CONTENT_TYPE);
            image.setDisplayOrder(nextOrder++);

            ItemImage saved = itemImageRepository.save(image);
            created.add(new ItemImageResponse(saved.getId(), "/api/images/" + saved.getId()));
        }

        return created;
    }
}

 