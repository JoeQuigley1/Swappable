package com.swappable.backend.item;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ItemImageRepository extends JpaRepository<ItemImage, Integer> {
    long countByItemId(Integer itemId);

    @Query("select img.id from ItemImage img where img.item.id = :itemId order by img.displayOrder asc")
    List<Integer> findIdsByItemId(@Param("itemId") Integer itemId);

    // batch variant used when mapping a whole page of items, so a page costs one
    // query here rather than one per item. Each row is [itemId, imageId].
    @Query("""
            select img.item.id, img.id from ItemImage img
            where img.item.id in :itemIds
            order by img.item.id asc, img.displayOrder asc
            """)
    List<Object[]> findIdsByItemIds(@Param("itemIds") List<Integer> itemIds);
}