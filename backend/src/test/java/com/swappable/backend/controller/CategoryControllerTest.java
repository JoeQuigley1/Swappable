package com.swappable.backend.controller;

import com.swappable.backend.category.Category;
import com.swappable.backend.category.CategoryController;
import com.swappable.backend.category.CategoryRepository;
import com.swappable.backend.item.ItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.mockito.MockitoAnnotations.openMocks;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.mockito.Mock;

class CategoryControllerTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ItemRepository itemRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        openMocks(this);
        CategoryController controller = new CategoryController(categoryRepository, itemRepository);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    private Category buildCategory(Integer id, String name) {
        Category category = new Category();
        ReflectionTestUtils.setField(category, "id", id);
        ReflectionTestUtils.setField(category, "name", name);
        return category;
    }

    @Test
    void getCategories_returnsItemCountForCategoryWithItems() throws Exception {
        Category books = buildCategory(1, "Books");

        when(categoryRepository.findAll()).thenReturn(List.of(books));
        when(itemRepository.countItemsByCategory())
                .thenReturn(List.<Object[]>of(new Object[]{1, 5L}));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Books"))
                .andExpect(jsonPath("$[0].itemCount").value(5));
    }

    @Test
    void getCategories_returnsZeroForCategoryWithNoItems() throws Exception {
        Category plants = buildCategory(2, "Plants");

        when(categoryRepository.findAll()).thenReturn(List.of(plants));
        when(itemRepository.countItemsByCategory())
                .thenReturn(List.<Object[]>of()); // no rows at all for this category

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].name").value("Plants"))
                .andExpect(jsonPath("$[0].itemCount").value(0));
    }

    @Test
    void getCategories_handlesMultipleCategoriesWithMixedCounts() throws Exception {
        Category books = buildCategory(1, "Books");
        Category clothing = buildCategory(2, "Clothing");
        Category plants = buildCategory(3, "Plants");

        when(categoryRepository.findAll()).thenReturn(List.of(books, clothing, plants));
        when(itemRepository.countItemsByCategory())
                .thenReturn(List.<Object[]>of(
                     new Object[]{1, 5L},
                     new Object[]{2, 2L}
                ));

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].itemCount").value(5))
                .andExpect(jsonPath("$[1].itemCount").value(2))
                .andExpect(jsonPath("$[2].itemCount").value(0));
    }
}