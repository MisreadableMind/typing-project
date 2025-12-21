To create database run script ```create_schema.sql```.

It needed to use user ```support_backend_service``` as backend account for database connections. This account have limited
permissions to perform only actions which can be needed for back-end operation, but with no access to schema
modification or deleting data from restricted tables.

## Using in production environment

For production environment database admin should set password for database user ```CHECK_IN_DOCKER_CONFIG```:

```SQL
ALTER USER backend_service WITH PASSWORD 'CHECK_IN_CONFIG';
```

## Using in development environments

For dev/stage environments simply run ```init_dev_users.sql```. This will initialize users with standard credentials:

* for database connection: username ```backend_service``` with password ```CHECK_IN_DOCKER_CONFIG```.

## Using with Docker for development

When used with Dockerfile, database ```typing_local``` with schema will be initialized automatically.

Access for administration:

- username: ```user```
- password: ```pass```

Access from back-end:

- username: ```backend_service```
- password: ```CHECK_IN_DOCKER_CONFIG```


## Migrations 

In order to create new migration, find the latest migration version and increase by one migration version.

```
INSERT INTO db_schema_log (name)
VALUES ('update-X.X.X.sql');

COMMIT;
```

Also do not forget to add new migration script to **database/Dockerfile**

Highly recommended run migrations manually on all envs.