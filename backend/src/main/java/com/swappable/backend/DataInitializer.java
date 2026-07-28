package com.swappable.backend;

import com.swappable.backend.item.Item;
import com.swappable.backend.item.ItemImage;
import com.swappable.backend.item.ItemImageRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ItemImageRepository itemImageRepository;

    public DataInitializer(ItemImageRepository itemImageRepository) {
        this.itemImageRepository = itemImageRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {

    }
}