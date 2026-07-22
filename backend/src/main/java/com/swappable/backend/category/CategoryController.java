package com.swappable.backend.category;

import org.springframework.web.bind.annotation.*;
import com.swappable.backend.item.ItemRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;

    public CategoryController(CategoryRepository categoryRepository,ItemRepository itemRepository) {
        this.categoryRepository = categoryRepository;
        this.itemRepository = itemRepository;
    }

    @GetMapping
    public List<CategoryResponse> getCategories() {
        Map<Integer, Long> countsByCategoryId = new HashMap<>();
        for (Object[] row : itemRepository.countItemsByCategory()) {
            countsByCategoryId.put((Integer) row[0], (Long) row[1]);
                   }
        return categoryRepository.findAll()
                .stream()
                .map(category -> new CategoryResponse(
                        category.getId(),
                        category.getName(),
                        countsByCategoryId.getOrDefault(category.getId(), 0L)
                ))
                .toList();
    }
}