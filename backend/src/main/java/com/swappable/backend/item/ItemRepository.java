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

    Page<Item> findByUserIdAndStatus(Integer userId, String status, Pageable pageable);

    Page<Item> findByCategoryId(Integer categoryId, Pageable pageable);

    Page<Item> findByArchivedFalse(Pageable pageable);

    Page<Item> findByCategoryIdAndArchivedFalse(Integer categoryId, Pageable pageable);

    Page<Item> findByUserIdAndArchivedFalse(Integer userId, Pageable pageable);

    long countByArchivedFalse();

    @Query("SELECT i.category.id, COUNT(i) FROM Item i WHERE i.archived = false GROUP BY i.category.id")
    List<Object[]> countItemsByCategory();
}