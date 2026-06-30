package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Integer> {
    List<ItemImage> findByItemIdOrderByDisplayOrderAsc(Integer itemId);
    long countByItemId(Integer itemId);

    @Query("select img.id from ItemImage img where img.item.id = :itemId order by img.displayOrder asc")
    List<Integer> findIdsByItemId(@Param("itemId") Integer itemId);
}