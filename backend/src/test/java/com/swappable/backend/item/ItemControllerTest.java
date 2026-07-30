package com.swappable.backend.item;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swappable.backend.category.Category;
import com.swappable.backend.category.CategoryRepository;
import com.swappable.backend.user.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@ExtendWith(MockitoExtension.class)
class ItemControllerTest {

    @Mock private ItemRepository itemRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ItemImageRepository itemImageRepository;
    @Mock private ImageService imageService;
    @Mock private ItemMapper itemMapper;

    private ItemController itemController;
    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private User owner;
    private User otherUser;
    private Category category;

    @BeforeEach
    void setUp() {
        itemController = new ItemController(itemRepository, categoryRepository, itemImageRepository, imageService, itemMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(itemController)
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();

        owner = new User();
        ReflectionTestUtils.setField(owner, "id", 1);
        owner.setUsername("owner");

        otherUser = new User();
        ReflectionTestUtils.setField(otherUser, "id", 2);
        otherUser.setUsername("other");

        category = new Category();
        ReflectionTestUtils.setField(category, "id", 1);
        ReflectionTestUtils.setField(category, "name", "Books");

        // Mockito returns empty lists by default for unstubbed Collection-returning
        // methods, but stubbing explicitly here for clarity / to avoid surprises.
        lenient().when(itemImageRepository.findIdsByItemId(org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(User user) {
        var auth = new UsernamePasswordAuthenticationToken(user, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private Item buildItem(Integer id, User owner) {
        Item item = new Item();
        ReflectionTestUtils.setField(item, "id", id);
        item.setUser(owner);
        item.setCategory(category);
        item.setTitle("Test Item");
        item.setDescription("desc");
        item.setCondition("Good");
        item.setStatus("available");
        return item;
    }

     // ---------- getAllItems (server side search and filters, #23 / #232) ----------

    private void stubSearch(Item... items) {
        when(itemRepository.search(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(items)));
        lenient().when(itemMapper.toResponses(anyList()))
                .thenReturn(List.of(items).stream().map(item -> itemResponse(item.getId())).toList());
    }

    private ItemResponse itemResponse(Integer id) {
        return new ItemResponse(id, "Test Item", "desc", "Good", null, "available", 1, "Books", 1, "owner",
                null, null, null, List.of(), null);
    }

    @Test
    void getAllItems_withoutFilters_passesNullsToSearch() throws Exception {
        stubSearch(buildItem(1, owner), buildItem(2, owner));

        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));

        verify(itemRepository).search(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withCategoryId_filtersByCategory() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items").param("categoryId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].categoryId").value(1));

        verify(itemRepository).search(eq(1), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withSearch_passesLowercasedContainsPattern() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items").param("search", "  Mountain BIKE "))
                .andExpect(status().isOk());

        verify(itemRepository).search(isNull(), isNull(), eq("%mountain bike%"), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withSearch_escapesUserTypedWildcards() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items").param("search", "50%_off"))
                .andExpect(status().isOk());

        verify(itemRepository).search(isNull(), isNull(), eq("%50!%!_off%"), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withBlankSearchAndCondition_treatsThemAsNoFilter() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items").param("search", "   ").param("condition", ""))
                .andExpect(status().isOk());

        verify(itemRepository).search(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withCondition_filtersByCondition() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items").param("condition", "Like New"))
                .andExpect(status().isOk());

        verify(itemRepository).search(isNull(), eq("Like New"), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllItems_withRadius_passesBoundingBoxAndRadians() throws Exception {
        stubSearch(buildItem(1, owner));

        mockMvc.perform(get("/api/items")
                        .param("lat", "53.35")
                        .param("lng", "-6.26")
                        .param("radiusKm", "25"))
                .andExpect(status().isOk());

        ArgumentCaptor<Double> minLat = ArgumentCaptor.forClass(Double.class);
        ArgumentCaptor<Double> maxLat = ArgumentCaptor.forClass(Double.class);
        verify(itemRepository).search(isNull(), isNull(), isNull(), eq(25.0), minLat.capture(), maxLat.capture(),
                any(), any(), eq(Math.toRadians(53.35)), eq(Math.toRadians(-6.26)), any(Pageable.class));

        // 25km is roughly a quarter of a degree of latitude either side of the user
        assertEquals(53.35 - 25 / 111.045, minLat.getValue(), 0.0001);
        assertEquals(53.35 + 25 / 111.045, maxLat.getValue(), 0.0001);
    }

    @Test
    void getAllItems_returns400_whenRadiusGivenWithoutCoordinates() throws Exception {
        mockMvc.perform(get("/api/items").param("radiusKm", "25"))
                .andExpect(status().isBadRequest());

        verify(itemRepository, never()).search(any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(Pageable.class));
    }

    @Test
    void getAllItems_returns400_whenRadiusIsNotPositive() throws Exception {
        mockMvc.perform(get("/api/items")
                        .param("lat", "53.35")
                        .param("lng", "-6.26")
                        .param("radiusKm", "0"))
                .andExpect(status().isBadRequest());

        verify(itemRepository, never()).search(any(), any(), any(), any(), any(), any(), any(), any(), any(),
                any(), any(Pageable.class));
    }

    // ---------- getMyItems (archived filter) ----------

    @Test
    void getMyItems_excludesArchived_forAuthenticatedUser() throws Exception {
        authenticateAs(owner);
        when(itemRepository.findByUserIdAndArchivedFalse(eq(1), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(buildItem(1, owner))));
        when(itemMapper.toResponses(anyList())).thenReturn(List.of(itemResponse(1)));

        mockMvc.perform(get("/api/items/my-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));

        verify(itemRepository).findByUserIdAndArchivedFalse(eq(1), any(Pageable.class));
        verify(itemRepository, never()).findByUserId(any(Integer.class), any(Pageable.class));
    }


    // ---------- updateItem ----------

    @Test
    void updateItem_returns403_whenNotOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        authenticateAs(otherUser);

        CreateItemRequest request = new CreateItemRequest(1, "New title", "desc", "Good");

        mockMvc.perform(put("/api/items/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateItem_returns404_whenItemNotFound() throws Exception {
        when(itemRepository.findById(999)).thenReturn(Optional.empty());
        authenticateAs(owner);

        CreateItemRequest request = new CreateItemRequest(1, "New title", "desc", "Good");

        mockMvc.perform(put("/api/items/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateItem_succeeds_forOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(itemRepository.save(item)).thenReturn(item);
        authenticateAs(owner);

        CreateItemRequest request = new CreateItemRequest(1, "New title", "desc", "Good");

        mockMvc.perform(put("/api/items/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // ---------- deleteItem ----------

    @Test
    void deleteItem_returns403_whenNotOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        authenticateAs(otherUser);

        mockMvc.perform(delete("/api/items/10"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteItem_returns404_whenItemNotFound() throws Exception {
        when(itemRepository.findById(999)).thenReturn(Optional.empty());
        authenticateAs(owner);

        mockMvc.perform(delete("/api/items/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteItem_succeeds_forOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        authenticateAs(owner);

        mockMvc.perform(delete("/api/items/10"))
                .andExpect(status().isNoContent());
    }

    // ---------- uploadImages ----------

    @Test
    void uploadImages_returns403_whenNotOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        authenticateAs(otherUser);

        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "fake".getBytes());

        mockMvc.perform(multipart("/api/items/10/images").file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    void uploadImages_returns404_whenItemNotFound() throws Exception {
        when(itemRepository.findById(999)).thenReturn(Optional.empty());
        authenticateAs(owner);

        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "fake".getBytes());

        mockMvc.perform(multipart("/api/items/999/images").file(file))
                .andExpect(status().isNotFound());
    }

    // ---------- deleteImage ----------

    @Test
    void deleteImage_returns403_whenNotOwner() throws Exception {
        Item item = buildItem(10, owner);
        when(itemRepository.findById(10)).thenReturn(Optional.of(item));
        authenticateAs(otherUser);

        mockMvc.perform(delete("/api/items/10/images/5"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteImage_returns404_whenItemNotFound() throws Exception {
        when(itemRepository.findById(999)).thenReturn(Optional.empty());
        authenticateAs(owner);

        mockMvc.perform(delete("/api/items/999/images/5"))
                .andExpect(status().isNotFound());
    }
}