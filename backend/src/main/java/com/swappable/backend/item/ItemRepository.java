package com.swappable.backend.item;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;



public interface ItemRepository extends JpaRepository<Item, Integer> {
    Page<Item> findByUserId(Integer user_id, Pageable pageable);

    List<Item> findByUserId(Integer user_id);

    List<Item> findByUserIdAndStatus(Integer userId, String status);

    Page<Item> findByUserIdAndStatus(Integer userId, String status, Pageable pageable);

    Page<Item> findByCategoryId(Integer categoryId, Pageable pageable);

    Page<Item> findByUserIdAndArchivedFalse(Integer userId, Pageable pageable);

    // Browse Items runs through this single query so every filter is applied in the
    // database. Each filter is optional: a null parameter switches its clause off.
    // The owner and category are fetch joined because ItemResponse always needs them,
    // which keeps a page to one query instead of one per item.
    // Distance uses a bounding box first (indexable) and only then the exact haversine
    // distance, so the trigonometry runs over a small candidate set.
    @Query(value = """
            select i from Item i
            join fetch i.user u
            join fetch i.category c
            where i.archived = false
              and (:categoryId is null or c.id = :categoryId)
              and (:condition is null or i.condition = :condition)
              and (:search is null
                   or lower(i.title) like :search escape '!'
                   or lower(i.description) like :search escape '!')
              and (:radiusKm is null or (
                    u.latitude between :minLat and :maxLat
                    and u.longitude between :minLng and :maxLng
                    and 6371.0 * acos(least(1.0,
                        cos(:latRadians) * cos(u.latitude * 0.017453292519943295)
                        * cos(u.longitude * 0.017453292519943295 - :lngRadians)
                        + sin(:latRadians) * sin(u.latitude * 0.017453292519943295)
                    )) <= :radiusKm
              ))
            """,
            countQuery = """
            select count(i) from Item i
            join i.user u
            join i.category c
            where i.archived = false
              and (:categoryId is null or c.id = :categoryId)
              and (:condition is null or i.condition = :condition)
              and (:search is null
                   or lower(i.title) like :search escape '!'
                   or lower(i.description) like :search escape '!')
              and (:radiusKm is null or (
                    u.latitude between :minLat and :maxLat
                    and u.longitude between :minLng and :maxLng
                    and 6371.0 * acos(least(1.0,
                        cos(:latRadians) * cos(u.latitude * 0.017453292519943295)
                        * cos(u.longitude * 0.017453292519943295 - :lngRadians)
                        + sin(:latRadians) * sin(u.latitude * 0.017453292519943295)
                    )) <= :radiusKm
              ))
            """)
    Page<Item> search(
            @Param("categoryId") Integer categoryId,
            @Param("condition") String condition,
            @Param("search") String search,
            @Param("radiusKm") Double radiusKm,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng,
            @Param("latRadians") Double latRadians,
            @Param("lngRadians") Double lngRadians,
            Pageable pageable
    );

    long countByArchivedFalse();

    @Query("SELECT i.category.id, COUNT(i) FROM Item i WHERE i.archived = false GROUP BY i.category.id")
    List<Object[]> countItemsByCategory();
}