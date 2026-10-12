# AGENTS.MD — Repository Guidelines & Rules

## Project Overview
This repository contains a **URL Shortener** application. 


## Directives & Execution Rules

### 1. Database Safety & Data Integrity (STRICT)
* **NO UNAUTHORIZED DATABASE MUTATIONS**: You are strictly forbidden from running drop commands (`DROP DATABASE`, `DROP TABLE`), destructive migrations, table truncations, or deleting production/development data without explicit user authorization in the prompt.
* **READ-ONLY BY DEFAULT**: Database queries during exploration or troubleshooting must be read-only (`SELECT`).
* **MIGRATION CONFIRMATION**: Any schema changes or database migrations (`prisma migrate`, `knex migrate`, raw SQL DDL) must be explicitly approved by the user before execution.

### 2. Instruction Compliance
* **NO MESSING AROUND**: Execute only the task requested by the user. Do not rewrite unrelated files, refactor untouched modules, or introduce unrequested third-party packages.
* **NO SILENT FIXES**: Do not alter configuration files (`.env`, `package.json`, database configs) unless specifically instructed.

### 3. Code Base Conventions
* Validate all URLs before shortening (enforce valid HTTP/HTTPS protocols).
* Handle short-code collisions gracefully at the database level.
* Keep controllers light; delegate shortening and redirection logic to the service layer.
* Ensure all error responses (e.g., 404 for expired/missing short links) return consistent JSON outputs.

### 4. Code Generation & Output
* Provide complete, functional code blocks. Do not leave placeholder comments like `// TODO: Implement later` in critical logic paths.
* When editing existing files, target only the relevant lines or functions to avoid breaking working code.