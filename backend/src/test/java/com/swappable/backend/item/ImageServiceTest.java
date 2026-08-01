package com.swappable.backend.item;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ImageServiceTest {

    private ImageService imageService;

    @BeforeEach
    void setUp() {
        imageService = new ImageService();
    }

    @Test
    void convertsValidPngToWebp() throws Exception {
        BufferedImage image =
                new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);

        image.setRGB(0, 0, Color.RED.getRGB());

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                output.toByteArray()
        );

        byte[] result = imageService.toWebp(file);

        assertThat(result).isNotEmpty();
        assertThat(new String(
                result,
                0,
                4,
                StandardCharsets.US_ASCII
        )).isEqualTo("RIFF");

        assertThat(new String(
                result,
                8,
                4,
                StandardCharsets.US_ASCII
        )).isEqualTo("WEBP");
    }

    @Test
    void rejectsEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> imageService.toWebp(file)
        );

        assertThat(exception.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(exception.getReason())
                .isEqualTo("Image file is empty");
    }

    @Test
    void rejectsUnsupportedContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                "application/pdf",
                "content".getBytes()
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> imageService.toWebp(file)
        );

        assertThat(exception.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(exception.getReason())
                .contains("Unsupported image type");
    }

    @Test
    void rejectsFileLargerThanEightMegabytes() {
        MultipartFile file = mock(MultipartFile.class);

        when(file.isEmpty()).thenReturn(false);
        when(file.getContentType()).thenReturn("image/jpeg");
        when(file.getSize()).thenReturn(8L * 1024 * 1024 + 1);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> imageService.toWebp(file)
        );

        assertThat(exception.getStatusCode())
                .isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(exception.getReason())
                .isEqualTo("Image must be smaller than 8 MB");
    }

    @Test
    void rejectsInvalidImageDataWithAllowedContentType() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "fake.png",
                "image/png",
                "not an actual image".getBytes()
        );

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> imageService.toWebp(file)
        );

        assertThat(exception.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(exception.getReason())
                .isEqualTo("Could not read image file");
    }
}