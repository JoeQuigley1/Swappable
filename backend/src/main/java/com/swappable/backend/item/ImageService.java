package com.swappable.backend.item;

import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
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

    public byte[] toWebp(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unsupported image type. Allowed: JPEG, PNG, WebP"
            );
        }

        try {
            // Scrimage will automatically handles EXIF orientation and metadata
            ImmutableImage image = ImmutableImage.loader().fromBytes(file.getBytes());
            return image
                    .bound(MAX_DIMENSION, MAX_DIMENSION)
                    .bytes(WebpWriter.DEFAULT.withQ(WEBP_QUALITY));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read image file");
        }
    }
}