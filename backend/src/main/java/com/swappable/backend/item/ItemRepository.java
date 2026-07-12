package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Integer> {
    List<Item> findByUserId(Integer user_id);

    @Query("SELECT i.category.id, COUNT(i) FROM Item i GROUP BY i.category.id")
    List<Object[]> countItemsByCategory();
}