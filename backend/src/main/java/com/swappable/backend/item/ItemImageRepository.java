package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Integer> {
    List<ItemImage>  findByItemIdOrderByDisplayOrderAsc(Integer itemId);
    long countByItemId(Integer itemId);
}