package com.swappable.backend.item;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;

@Service
public class ImageService {

    public static final String WEBP_CONTENT_TYPE = "image/webp";

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final int MAX_DIMENSION = 1200;
    private static final int WEBP_QUALITY = 80;

    private static final long MAX_FILE_SIZE = 8L * 1024 * 1024;
    private static final long MAX_PIXELS = 10_000_000L;
    private static final int MAX_SOURCE_DIMENSION = 6000;

    public byte[] toWebp(MultipartFile file) {
        validateFile(file);
        validateDimensions(file);

        try {
            ImmutableImage image = ImmutableImage.loader().fromBytes(file.getBytes());
            return image
                    .bound(MAX_DIMENSION, MAX_DIMENSION)
                    .bytes(WebpWriter.DEFAULT.withQ(WEBP_QUALITY));
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Could not read image file"
            );
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Image file is empty"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image type. Allowed: JPEG, PNG, WebP"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "Image must be smaller than 8 MB"
            );
        }
    }

    private void validateDimensions(MultipartFile file) {
        try (ImageInputStream input =
                     ImageIO.createImageInputStream(file.getInputStream())) {

            if (input == null) {
                throw invalidImage();
            }

            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);

            if (!readers.hasNext()) {
                throw invalidImage();
            }

            ImageReader reader = readers.next();

            try {
                reader.setInput(input, true, true);

                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                long pixels = (long) width * height;

                if (width > MAX_SOURCE_DIMENSION ||
                        height > MAX_SOURCE_DIMENSION ||
                        pixels > MAX_PIXELS) {
                    throw new ResponseStatusException(
                            HttpStatus.PAYLOAD_TOO_LARGE,
                            "Image resolution is too large"
                    );
                }
            } finally {
                reader.dispose();
            }

        } catch (ResponseStatusException e) {
            throw e;
        } catch (IOException | RuntimeException e) {
            throw invalidImage();
        }
    }

    private ResponseStatusException invalidImage() {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Could not read image file"
        );
    }
}