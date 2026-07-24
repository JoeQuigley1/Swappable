package com.swappable.backend;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.awt.Color;
import java.io.File;
import java.util.Random;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    CommandLineRunner generateImages() {
        return args -> {
            int totalImages = 1000;
            File outputDir = new File("./simulated_images");

            if (!outputDir.exists()) {
                outputDir.mkdirs();
            }

            Random random = new Random();
            System.out.println("Starting image simulation...");
            long startTime = System.currentTimeMillis();

            for (int i = 1; i <= totalImages; i++) {
                Color randomColor = new Color(
                        random.nextInt(256),
                        random.nextInt(256),
                        random.nextInt(256)
                );

                try {
                    ImmutableImage image = ImmutableImage.filled(800, 600, randomColor);
                    File outputFile = new File(outputDir, "image_" + i + ".webp");
                    image.output(WebpWriter.DEFAULT, outputFile);
                } catch (Exception e) {
                    System.err.println("Failed to generate image " + i + ": " + e.getMessage());
                }
            }

            long endTime = System.currentTimeMillis();
            System.out.println("Finished! Generated " + totalImages + " images in " + (endTime - startTime) + "ms.");
        };
    }
}