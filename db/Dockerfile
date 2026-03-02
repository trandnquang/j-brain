# PostgreSQL 16 with pgvector extension pre-installed
# pgvector/pgvector:pg16 is based on postgres:16-alpine
FROM pgvector/pgvector:pg16

# init.sql is executed automatically by the official postgres entrypoint
# on the very first container start (when the data directory is empty).
COPY init.sql /docker-entrypoint-initdb.d/01_init.sql