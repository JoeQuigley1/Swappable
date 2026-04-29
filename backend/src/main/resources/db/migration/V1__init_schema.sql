CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    condition VARCHAR(20) NOT NULL,
    image_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE swap_requests (
    id SERIAL PRIMARY KEY,
    requester_id INT NOT NULL,
    owner_id INT NOT NULL,
    requested_item_id INT NOT NULL,
    offered_item_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_swap_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_swap_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_swap_requested_item FOREIGN KEY (requested_item_id) REFERENCES items(id),
    CONSTRAINT fk_swap_offered_item FOREIGN KEY (offered_item_id) REFERENCES items(id)
);