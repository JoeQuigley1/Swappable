package com.swappable.backend.common;

import org.springframework.data.domain.Page;
import java.util.List;

public record PagedResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {
    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
}

    // for callers that map the page content in one batch instead of element by element
    public static <T> PagedResponse<T> from(Page<?> page, List<T> content) {
        return new PagedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

}
