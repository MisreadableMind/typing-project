INSERT INTO db_schema_log (name)
VALUES ('update-0.1.0.sql');

COMMIT;

ALTER TABLE messages
    ADD COLUMN has_screenshots BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE messages
    ADD COLUMN need_website_access BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE messages
    ADD COLUMN step_assigned_to VARCHAR(255) NULL;

ALTER TABLE messages
    ADD COLUMN llm_model VARCHAR(255) NULL; -- LLM = Large Language Model

ALTER TABLE messages
    ADD COLUMN system_prompt TEXT NULL;

COMMIT;
-- LOCK: this script is deployed to working environment, do not modify
