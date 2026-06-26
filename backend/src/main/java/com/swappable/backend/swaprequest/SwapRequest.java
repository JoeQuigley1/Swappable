package com.swappable.backend.swaprequest;

import com.swappable.backend.item.Item;
import com.swappable.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

@Entity
@Table(name = "swap_requests")
@Getter
@Setter
public class SwapRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne
    @JoinColumn(name = "requested_item_id", nullable = false)
    private Item requestedItem;

    @ManyToOne
    @JoinColumn(name = "offered_item_id", nullable = false)
    private Item offeredItem;

    @Column(nullable = false)
    private String status = "pending";

    private String message;

    private LocalDateTime createdAt = LocalDateTime.now();
}