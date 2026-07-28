-- allow deleting a user to cascade to their items and swap requests
ALTER TABLE items DROP CONSTRAINT fk_items_user;
ALTER TABLE items ADD CONSTRAINT fk_items_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE swap_requests DROP CONSTRAINT fk_swap_requester;
ALTER TABLE swap_requests ADD CONSTRAINT fk_swap_requester
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE swap_requests DROP CONSTRAINT fk_swap_owner;
ALTER TABLE swap_requests ADD CONSTRAINT fk_swap_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE swap_requests DROP CONSTRAINT fk_swap_requested_item;
ALTER TABLE swap_requests ADD CONSTRAINT fk_swap_requested_item
    FOREIGN KEY (requested_item_id) REFERENCES items(id) ON DELETE CASCADE;

ALTER TABLE swap_requests DROP CONSTRAINT fk_swap_offered_item;
ALTER TABLE swap_requests ADD CONSTRAINT fk_swap_offered_item
    FOREIGN KEY (offered_item_id) REFERENCES items(id) ON DELETE CASCADE;
