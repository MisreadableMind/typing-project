INSERT INTO db_schema_log (name)
VALUES ('init_dev_users.sql');
COMMIT;

-- default password for development environment
ALTER USER backend_service
    WITH PASSWORD 'WIsC@9W>IT39';
COMMIT;