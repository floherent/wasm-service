# Changelog

All notable changes to this project will be documented in this file. See
[standard-version](https://github.com/conventional-changelog/standard-version)
for commit guidelines.

## 0.1.4 (2025-06-05)

- Fix bug in uploading WASM modules.
- Update documentation for Docker deployment.
- Add OpenAPI documentation.

## 0.1.3 (2024-04-25)

- Add support for static and dynamic validations
- Add support for request metadata in the execution endpoint

## 0.1.2 (2024-04-15)

- Fix vulnerabilities in dependencies (use `Node@20.11.1` and `npm@10.5.2`)
- Switch package manager from `yarn` to `npm` for docker builds.
- Fix wrong module imports causing test failure.

## 0.1.1 (2023-12-15)

- Upgrade `@coherentglobal/wasm-runner` dependency to latest (`v0.0.103`).
- Add support for columnar data.
- Add batch processing endpoints.
- Use volume of cylinder as a built-in example of WASM bundle.
- Document endpoints using OpenAPI.

## 0.1.0+2 (2023-08-25)

- Upgrade `@coherentglobal/wasm-runner` dependency to latest (`v0.0.102`).
- Add endpoint for adding WASM modules by URL.

## 0.1.0+1 (2023-07-28)

- Update `README.md` and include EC2 deployment documentation.
- Fix GitHub Actions workflow.

## 0.1.0 (2023-06-15)

Initial release candidate.

- Add endpoints for uploading, executing, downloading, and deleting WASM modules.
- Add endpoint for retrieving the execution history.
- Add health check endpoint.
- Add support for running the service via Docker.
