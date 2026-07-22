package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Integer> {
    List<Item> findByUserId(Integer user_id);

    Page<Item> findByUserIdNot(Integer userId, Pageable pageable);

    Page<Item> findByCategoryIdAndUserIdNot(Integer categoryId, Integer userId, Pageable pageable);

    Page<Item> findByTitleContainingIgnoreCaseAndUserIdNot(String title, Integer userId, Pageable pageable);
}