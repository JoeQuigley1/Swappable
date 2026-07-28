package com.swappable.backend.swaprequest;

import com.swappable.backend.item.Item;
import com.swappable.backend.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "swap_requests")
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

    @Column(name = "requester_confirmed", nullable = false)
    private boolean requesterConfirmed = false;

    @Column(name = "owner_confirmed", nullable = false)
    private boolean ownerConfirmed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    private String message;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters
    public Integer getId() { return id; }
    public User getRequester() { return requester; }
    public User getOwner() { return owner; }
    public Item getRequestedItem() { return requestedItem; }
    public Item getOfferedItem() { return offeredItem; }
    public String getStatus() { return status; }
    public boolean isRequesterConfirmed() { return requesterConfirmed; }
    public boolean isOwnerConfirmed() { return ownerConfirmed; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters:wq
    public void setId(Integer id) { this.id = id; }
    public void setRequester(User requester) { this.requester = requester; }
    public void setOwner(User owner) { this.owner = owner; }
    public void setRequestedItem(Item requestedItem) { this.requestedItem = requestedItem; }
    public void setOfferedItem(Item offeredItem) { this.offeredItem = offeredItem; }
    public void setStatus(String status) { this.status = status; }
    public void setRequesterConfirmed(boolean requesterConfirmed) { this.requesterConfirmed = requesterConfirmed; }
    public void setOwnerConfirmed(boolean ownerConfirmed) { this.ownerConfirmed = ownerConfirmed; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    public void setMessage(String message) { this.message = message; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}