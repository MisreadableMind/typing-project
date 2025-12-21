FROM postgres:14.2-alpine

ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=taptaptap_local

# initialization scripts executed automatically by image from this directory
WORKDIR docker-entrypoint-initdb.d/

# initialization scripts executed in alphabetical order
COPY create_database_roles.sql ./init_001.sql
COPY create_schema.sql ./init_002.sql
COPY init_dev_users.sql ./init_003.sql
COPY update-0.1.0.sql ./init_004.sql