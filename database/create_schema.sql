-- this is database ROLE for back-end services

CREATE SEQUENCE db_schema_log_id START WITH 1;

CREATE TABLE db_schema_log
(
    id             BIGINT    NOT NULL DEFAULT nextval('db_schema_log_id'),
    execution_time TIMESTAMP NOT NULL DEFAULT current_timestamp,
    name           VARCHAR   NOT NULL,
    PRIMARY KEY (id)
);

ALTER SEQUENCE db_schema_log_id OWNED BY db_schema_log.id;

INSERT INTO db_schema_log (name)
VALUES ('create_schema.sql');

COMMIT;

-- COMMON FUNCTIONS
CREATE FUNCTION tg_timing_rows_handler()
    RETURNS TRIGGER AS
$$
BEGIN
    IF (OLD IS NULL) THEN
        BEGIN
            NEW.created_at = current_timestamp;
            NEW.updated_at = NULL;
        END;
    ELSE
        NEW.created_at = OLD.created_at;
        NEW.updated_at = current_timestamp;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- USER DATA AND ROLES
CREATE TABLE role_entity
(
    id   INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    PRIMARY KEY (id)
);

INSERT INTO role_entity (id, name)
VALUES (1, 'user'),
       (2, 'admin');

GRANT SELECT
    ON role_entity TO role_service;

COMMIT;

-- MESSAGES
CREATE TABLE messages
(
    id                UUID        NOT NULL PRIMARY KEY,
    ticket_id         VARCHAR     NOT NULL,
    ticket_topic      VARCHAR     NOT NULL,
    theme_title       VARCHAR     NOT NULL,
    query             JSONB       NOT NULL,
    suggestion_text   TEXT        NULL,
    source_documents  JSONB       NULL,
    status            VARCHAR     NOT NULL CHECK (status IN ('received', 'processing', 'completed', 'failed')),
    created_at        TIMESTAMP   DEFAULT current_timestamp NOT NULL,
    updated_at        TIMESTAMP   DEFAULT current_timestamp NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE
    ON messages TO role_support_service;

COMMIT;

-- LOCK: this script is deployed to working environment, do not modify
