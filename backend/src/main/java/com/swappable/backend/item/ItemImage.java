package com.swappable.backend.item;

import jakarta.persistence.*;

@Entity
@Table(name = "item_images")
public class ItemImage {
  @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(name = "data")
    private byte[] data;

    @Column(name = "content_type")
    private String contentType;

    @Column(name = "display_order")
    private int displayOrder;

    public Integer getId() {
        return id;
    }

    public Item getItem() {
        return item;
    }

    public byte[] getData() {
        return data;
    }

    public String getContentType() {
        return contentType;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public void setDisplayOrder(int displayOrder) {
        this.displayOrder = displayOrder;
    }
}