package com.swappable.backend.item;


import com.swappable.backend.category.Category;
import com.swappable.backend.category.CategoryRepository;
import com.swappable.backend.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.swappable.backend.common.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;


import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final ItemImageRepository itemImageRepository;
    private final ImageService imageService;
    private static final List<String> VALID_CONDITIONS = List.of(
            "New",
            "Like New",
            "Good",
            "Fair",
            "Poor"
    );

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

    private ItemResponse toResponse(Item item) {
        List<String> imageUrls = itemImageRepository.findIdsByItemId(item.getId())
                .stream()
                .map(imageId -> "/api/images/" + imageId)
                .toList();

        String cover = !imageUrls.isEmpty()
                ? imageUrls.get(0)
                : item.getImageUrl();

        return new ItemResponse(
                item.getId(),
                item.getTitle(),
                item.getDescription(),
                item.getCondition(),
                cover,
                item.getStatus(),
                item.getCategory().getId(),
                item.getCategory().getName(),
                item.getUser().getUsername(),
                item.getUser().getLocation(),
                item.getUser().getLatitude(),
                item.getUser().getLongitude(),
                imageUrls,
                item.getCreatedAt()
        );
    }

    private User getAuthenticatedUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                !(authentication.getPrincipal() instanceof User user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication required"
            );
        }

        return user;
    }



    @GetMapping
    public PagedResponse<ItemResponse> getAllItems(@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ItemResponse> page = itemRepository.findAll(pageable).map(this::toResponse);

        return PagedResponse.from(page);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> getItemById(@PathVariable Integer id) {
        return itemRepository.findById(id)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/my-items")
    public PagedResponse<ItemResponse> getMyItems(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        User user = getAuthenticatedUser();

        Page<ItemResponse> page = itemRepository.findByUserId(user.getId(), pageable)
                .map(this::toResponse);

        return PagedResponse.from(page);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ItemResponse createItem(
           @Valid @RequestBody CreateItemRequest request
    ) {

        User user = getAuthenticatedUser();

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

        return toResponse(savedItem);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ItemResponse createItemWithImages(
            @RequestParam("categoryId") Integer categoryId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("condition") String condition,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {

        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Title must not be blank"
            );
        }

        if (condition == null || condition.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Condition must not be blank"
            );
        }

        if (!VALID_CONDITIONS.contains(condition)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid condition"
            );
        }

        User user = getAuthenticatedUser();

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid CategoryId"
                ));

        Item item = new Item();
        item.setUser(user);
        item.setCategory(category);
        item.setTitle(title);
        item.setDescription(description);
        item.setCondition(condition);
        item.setStatus("available");

        Item savedItem = itemRepository.save(item);

        if (images != null && !images.isEmpty()) {
            saveImages(savedItem, images);
        }

        return toResponse(savedItem);
    }

    @PutMapping("/{id}")
    public ItemResponse updateItem(
            @PathVariable Integer id,
            @Valid @RequestBody CreateItemRequest request
    ) {
        User user = getAuthenticatedUser();

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

        return toResponse(savedItem);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@PathVariable Integer id) {

        User user = getAuthenticatedUser();

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
        User user = getAuthenticatedUser();

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

        return saveImages(item, files);
    }

    private List<ItemImageResponse> saveImages(Item item, List<MultipartFile> files) {
        long existingCount = itemImageRepository.countByItemId(item.getId());
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

    @DeleteMapping("/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(
            @PathVariable Integer id,
            @PathVariable Integer imageId
    ) {
        User user = getAuthenticatedUser();

        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Item not found"
                ));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You can only delete images from your own items"
            );
        }

        ItemImage image = itemImageRepository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Image not found"
                ));

        if (!image.getItem().getId().equals(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Image not found"
            );
        }

        itemImageRepository.delete(image);
    }
}