package com.swappable.backend.item;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;

@Entity
@Table (name = "items")
public class Item{

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "test_notes")
    private String testNotes;

    //getters are to dead the data

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTestNotes() {
        return testNotes;
    }

    // Setters are to change the data

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setTestNotes(String testNotes) {
        this.testNotes = testNotes;
    }
}