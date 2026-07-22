package com.swappable.backend.item;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;



public interface ItemRepository extends JpaRepository<Item, Integer> {
    Page<Item> findByUserId(Integer user_id, Pageable pageable);

    List<Item> findByUserId(Integer user_id);

    List<Item> findByUserIdAndStatus(Integer userId, String status);

    Page<Item> findByCategoryId(Integer categoryId, Pageable pageable);

    @Query("SELECT i.category.id, COUNT(i) FROM Item i GROUP BY i.category.id")
    List<Object[]> countItemsByCategory();
}