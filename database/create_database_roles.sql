CREATE ROLE role_service;

COMMIT;

CREATE USER backend_service WITH IN ROLE role_service;

COMMIT;
