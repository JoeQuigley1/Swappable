package com.swappable.backend.item;

public class ItemDto {

    private Long id;
    private String name;
    private String testNotes;

    // the Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTestNotes() {
        return testNotes;
    }

    // The Setters
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