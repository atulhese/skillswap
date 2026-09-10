ALTER TABLE swap_requests
    ADD COLUMN zoom_meeting_id VARCHAR(64) NULL,
    ADD COLUMN zoom_join_url TEXT NULL,
    ADD COLUMN zoom_start_url TEXT NULL,
    ADD COLUMN zoom_password VARCHAR(128) NULL,
    ADD COLUMN zoom_start_time DATETIME NULL,
    ADD COLUMN zoom_duration INT NULL;

CREATE INDEX idx_swap_requests_zoom_meeting_id
    ON swap_requests (zoom_meeting_id);

-- Run this migration once against the skill_swap database before starting the backend.
