CREATE TABLE item_images (
    id SERIAL PRIMARY KEY,
    item_id INT NOT NULL,
    data BYTEA NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_images_item_id ON item_images(item_id);