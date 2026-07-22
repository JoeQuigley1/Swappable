package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Integer> {
    List<Item> findByUserId(Integer user_id);
    List<Item> findByUserIdNot(Integer userId);
    List<Item> findByTitleContainingIgnoreCase(String titleKeyword);
}