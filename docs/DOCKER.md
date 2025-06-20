# WASM Service

Standalone API service for running WebAssembly (or [WASM]) modules generated by
[Coherent Spark][coherent-site].

> **NOTE:** This Docker repository/image is intended for Coherent Spark users only.

## Getting Started

Coherent Spark (or simply _Spark_) enables some powerful features for your Excel
models. Among them is the ability to convert them to web assembly modules. That
is, once an Excel model is uploaded to Spark, Spark generates a WASM representation
of it that you can later download and use in your own application independently.

Visit the [Coherent Spark's User Guide][user-guide] for more details.

👋 **Just a heads-up:**

This Docker image isn't officially supported by Coherent. It originally started as
a sample API service I built for demo purposes. I then thought, "Why not share it
with the community?" So, here we are!

If you encounter any bumps while using it, please report them [here][github-issue]
by creating a new issue.

## Usage

Once the Docker engine/daemon is up and running, follow these steps:

- Pull the Docker image using the following commands:

```bash
docker pull ralflorent/wasm-service
```

- Run the service:

```bash
docker run --name wasm-service -p 8080:8080 -d ralflorent/wasm-service
```

**PROTIPS:**
You may use a named volume to persist the data. Otherwise, the data will be lost
when the container is removed.

```bash
docker run --name wasm-service -p 8080:8080 -v ws-data:/app/uploads -d ralflorent/wasm-service
```

## API Reference

Below is a quick reference of the API endpoints. For more details, please refer to
the API documentation (OpenAPI 3.0 - Swagger UI) at `http://localhost:8080/docs` or
`http://localhost:8080/docs-json`, assuming that the base URL is `http://localhost:8080`.

The service is also shipped with a built-in WASM bundle (volume of cylinder) that
you may use to test the service.

| Use Cases                  | Resources                                   |
| -------------------------- | ------------------------------------------- |
| API Documentation          | `GET /docs` or `GET /docs-json`             |
| Health check               | `GET /health`                               |
| Get current configuration  | `GET /v1/config`                            |
| List all WASM modules      | `GET /v1/services`                          |
| Upload a WASM module       | `PUT /v1/services[/{version_id}]`           |
| Add WASM module by URL     | `PATCH /v1/services[/{version_id}]`         |
| Execute a WASM module      | `POST /v1/services/{version_id}/execute`    |
| Fetch WASM validations     | `POST /v1/services/{version_id}/validation` |
| Get WASM execution history | `GET /v1/services/{version_id}/history`     |
| Download a WASM module     | `GET /v1/services/{version_id}`             |
| Delete a WASM module       | `DELETE /v1/services/{version_id}`          |

For batch operations, use the following endpoints:

| Use Cases           | Resources                          |
| ------------------- | ---------------------------------- |
| Create a batch      | `POST /v1/batch/{service_id}`      |
| Get a batch status  | `GET /v1/batch/{batch_id}/status`  |
| Get a batch result  | `GET /v1/batch/{batch_id}/results` |
| Delete 1+ batch(es) | `DELETE /v1/batch`                 |

**NOTE:** Keep in mind that batch operations are asynchronous and memory-intensive.
You should use them with caution.

As a bonus, you can use [web sockets (Socket.IO)][web-sockets] and listen to these
events to get the batch status and results:

- `batch:completed`
- `batch:failed`

> Example of connection URL: `ws://localhost:8080`.

## Configuration

To customize the behavior of the service, you can use a YAML-based configuration file.
By default, the service uses the following configuration (see its [schema][json-schema]
for more details):

### Default configuration

```yaml
name: wasm-service
description: API service for running WASM files

service:
  port: 8080
  contextPath: /
  uploadPath: uploads
  bodyLimit: 50mb

performance:
  spark:
    cacheSize: 8
    threads: 1
    replicas: 1
  health:
    indicators:
      disk: 0.75
      wasm: 512
      memory: 1024
```

### Custom configuration

To load a custom configuration file:

- specify its path in the environment variable as `WS_CONFIG_PATH`
- then mount the file to the container.

```bash
# on the host machine, create a directory for the config file
$ mkdir -p /local/path/to/config
$ cd /local/path/to/config

# create and edit the custom config file
$ vim custom-config.yml

# run the service with docker and mount the config file
$ docker run --name wasm-service -p 8080:8080 -v ws-data:/app/uploads -d \
  -v /local/path/to/config:/config \
  -e WS_CONFIG_PATH=/config/custom-config.yml \
  ralflorent/wasm-service
```

## Support and Feedback

If you have any questions or feedback, feel free to reach out to me directly or
create a new issue [on GitHub][github-issue].

<!-- References -->

[coherent-site]: https://www.coherent.global
[user-guide]: https://docs.coherent.global/
[json-schema]: https://github.com/floherent/wasm-service/blob/main/.config/schema.json
[web-sockets]: https://socket.io/docs/v4/client-api/
[wasm]: https://webassembly.org/
[github-issue]: https://github.com/floherent/wasm-service/issues
