# Developer guide

This developer documentation dives into technical details of the `wasm-service`,
including its scope, its API reference and more.

This guide will walk you through:

- a reference implementation for running the [Web Assembly][wasm.org] (WASM)
  module, also known as *offline deployments*,
- and the steps that help you set up a development environment and extend the
  service's functionality.

## Introduction

`wasm-service` is a sample RESTful API that lets you run WASM modules generated
by Coherent Spark. It is built with [Node@16.14](https://nodejs.org/en/download)
and [NestJS@9.0](https://docs.nestjs.com/). Though it is built to be used as a
standalone service, this service is also microservice-friendly.

As NestJS's philosophy dictates, the service is built with modularity in mind.
It is composed of several modules that can be easily extended or updated to suit
your needs. Those modules are: `HealthModule`, `ServicesModule`, and `ConfigModule`.

The `ServicesModule` is a simple module that exposes a few endpoints, among them,
one that relies heavily on the [@coherentglobal/wasm-runner][wasm-runner]
Node.js package's core logic.

Some other coding techniques and practices considered throughout this service
implementation are:

- [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation)
- [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Docker](https://www.docker.com/)
- [OpenAPI](https://swagger.io/specification/)

## Getting started

What you will need to get started:

0. have a copy of this repository
1. choose an IDE or text editor
2. set up your development environment
3. download the WASM from Spark
4. execute the WASM offline.

### Choose an IDE or text editor

We recommend using [Visual Studio Code](https://code.visualstudio.com/) as your
IDE. It is free, open source, and has a great community.

### Set up your development environment

Install [Node][nodejs.org] (we use `16.14.2` in our example) and dependencies,
then run the service.

```bash
# install dependencies
$ npm install

# start the service
$ npm run start:dev
```

> Make sure NPM is installed via `npm -v` (this will output the current version).
> Feel free to use other Node package managers like `yarn` to proceed.

### Download the WASM from Spark

Once logged into Spark, navigate to the service you would like to execute offline.

- From the folder page in Spark: select the service > click the 3-dot menu >
  click on **Download service**.
- In the "Download service" modal, choose the version you'd like to download and
  in "Select file type" choose **Web Assembly Module**.

If you would like to check if you got the correct zip file, you can unzip it and
make sure the following files are present:

- `your-service.wasm`
- `your-service.data`
- `your-service.js`
- and some other files (e.g. checksums, etc.)

> You may write down the `versionId` of the WASM that you downloaded if you want
> to use it as a unique identifier to execute the WASM.
> You may choose to use the [wasm file](../examples/ExpectedCreditLossesModel.zip)
> (and its versionId: `e57f48e7-fe8c-4202-b8bc-5d366cf1eee9`) provided in this
> repository as well.

### Execute the WASM offline

See the [Execute a WASM module](#execute-a-wasm-module) in the
[API reference](#api-reference) section for more details.

## Application configuration

The configuration for the WASM service is stored in a YAML file named `config.yml`.
That [file](../.config/config.yml) contains various parameters that can be adjusted
to customize the behavior of the service.

You may save a configuration file in a different location and specify its path
in the environment variable as `WS_CONFIG_PATH`. That way, the service will load
the configuration from the specified path instead of the default one.

If you choose to use docker to run the service, for example, you can mount the
config file to the container and set the environment variable to the mounted path.

```bash
$ cd /local/path/to/config
$ vim config.yml # create and edit the config file

# run the service with docker and mount the config file
$ docker run --name wasm-service -p 8080:8080 -d \
  -v /local/path/to/config:/config \
  -e WS_CONFIG_PATH=/config/config.yml \
  wasm-service
```

### Service configuration

The service configuration section includes the following parameters:

- `name`: specifies the name of the WASM service. In this case, the name is set
  to **wasm-service**.
- `description`: provides a brief description of the service's purpose. For
  example, the description states that the service is *an API for running WASM files*.
- `service.port`: specifies the port number on which the service will listen for
  incoming requests. The default port is set to **8080**.
- `service.contextPath`: defines the context path for the service. Requests to
  the service's API endpoints will be prefixed with this path. By default, the
  context path is set to `/`.
- `service.uploadPath`: specifies the directory path where the uploaded files
  will be stored. The default upload path is set to `./uploads`.
- `service.dataPath`: specifies the file path for storing the records of the
  upload process. The default file path is set to `./uploads/wasm-data.csv`.

### Performance configuration

The performance configuration section includes the following parameters:

- `performance.spark.cacheSize`: specifies the number of service instances to cache.
  The cache is used to store frequently accessed wasms to improve performance. By
  default, the cache size is set to **16**.
- `performance.spark.threads`: default to 1, specifies the number of parallel threads
  to use for the WASM execution.
- `performance.spark.replicas`: default to 2, specifies the number of replicas to
  use for the WASM execution.
- `performance.health.indicators.disk`: sets the threshold in percentage
  (between 0.0 and 1.0) for the disk usage. By default, it is set to 0.75%.
- `performance.health.indicators.wasm`: sets the threshold size in megabytes
  for the health check related to the WASM data. If the size of the data
  exceeds this threshold, it may indicate potential performance issues. The default
  threshold is set to 512 MB.
- `performance.health.indicators.memory`: sets the threshold size in megabytes
  for the health check related to memory usage. If the memory consumption exceeds
  this threshold, it may affect the service's performance. The default value is
  set to 256 MB.

**NOTE**: These configuration parameters can be modified as per requirements of the
deployment environment and the specific needs of the WASM service. It is important
to review and adjust these settings appropriately to ensure optimal performance
and reliability.

## API reference

The base URL for all the endpoints is `http://localhost:8080`.
See the [Postman collection](postman-collection.json) for more details.

Additionally, you can use the Swagger UI (WIP) `http://localhost:8080/docs` to
visualize and explore the API endpoints.

### Check health status

GET **/health** - Check the health status of the service.

This endpoint checks the following health indicators:

- **wasm data**: checks the WASM data storage.
- **disk storage**: checks the disk storage.
- **memory heap**: checks the memory heap.
- **memory rss**: checks the memory rss (resident set size).

It can also be used by a Kubernetes cluster to determine whether the service is
up and running or not.

Response: **200-OK** / **503-Service Unavailable**

```json
{
  "status": "ok",
  "info": {
    "wasm data": {
      "status": "up",
      "sizeInMB": 0.802
    },
    "disk storage": {
      "status": "up"
    },
    "memory heap": {
      "status": "up"
    },
    "memory rss": {
      "status": "up"
    }
  },
  "error": {},
}
```

### Upload WASM module

PUT /v1/services/**{version_id}** - Upload a WASM bundle file.

> NOTE: if the `version_id` is not provided, the service will generate one for
> the uploaded WASM file.

Body: **multipart/form-data**

- **wasm**: WASM bundle file
- **data** (optional): JSON payload containing some WASM metadata

```json
{
  "service_name": "expected-loss",
  "revision": "0.3.0",
  "username": "john.doe@coherent.global",
}
```

This endpoint is used to upload a WASM bundle file to the service. The file is
then stored in the file system and the metadata is stored as part of CSV file
for future references.

Response: **201-Created** / **400-Bad Request** / **422-Unprocessable Entity**

```json
{
  "version_id": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9",
  "file_name": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9.zip",
  "file_path": "uploads/e57f48e7-fe8c-4202-b8bc-5d366cf1eee9.zip",
  "original_name": "ExpectedCreditLossesModel.zip",
  "size": 432451,
  "uploaded_at": "2023-06-23T15:34:09.839Z",
  "service_name": "expected-loss",
  "revision": "0.3.0",
  "username": "john.doe@coherent.global"
}
```

### Execute a WASM module

POST /v1/services/**{version_id}/execute** - Execute a WASM module.

Body: **application/json**

- **inputs**: JSON payload containing the input data for the WASM module to
  be executed. For example:

```json
{
  "inputs": {
    "AssessmentDate": "2022-08-31",
    "CashFlowTypes": "Level",
    "CCF": 0.551,
    "Contract_IR": 0.223,
    "LGD": 0.8095,
    "LoanLimit": 134000,
    "NextPaymentDate": "2022-09-30",
    "ObligorRating": "D",
    "OutstandingBalance": 325000,
    "PaymentFreq": 12,
    "RecoveryLags": 10,
    "Segment": 1,
    "Stage_Regular": 2
  }
}
```

This endpoint is used to execute a WASM module. Once executed, it will return a
JSON payload that contains the `outputs` data of the calculations.

Response: **200-OK** / **400-Bad Request** / **422-Unprocessable Entity**

```json
{
  "response_data": {
    "outputs": {
      "PVExpected": 201637.709154489,
      "ImpairmentRatio": 0.0642152198859025,
      "PDC": [
        {
          "1": 0.108,
          "13": 0.1108,
          "25": 0.11,
          "37": 0.107,
          "49": 0.103,
          "61": 0.0985,
          "73": 0.0939,
          "85": 0.0894,
          "97": 0.0851,
          "109": 0.081,
          "121": 0.0772,
          "133": 0.0737,
          "145": 0.0704,
          "157": 0.0674,
          "169": 0.0645,
          "181": 0.0618,
          "193": 0.0593,
          "205": 0.057,
          "217": 0.0547,
          "229": 0.0526,
          "241": 0.0506,
          "253": 0.0506,
          "265": 0.0506
        }
      ],
      "Final_ECL": 14111.872506906,
      "ExpectedBehaviouralLife": 17,
      "GrossCarryingAmount": 219759,
      "PVContractual": 215749.581661395,
      "ContractualMaturityDate": "2024-01-31"
    }
  },
  "response_meta": {
    "version_id": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9",
    "correlation_id": "",
    "service_category": "",
    "compiler_type": "Neuron",
    "system": "SPARK",
    "compiler_version": "1.3.1",
    "process_time": 8
  }
}
```

> NOTE: you may indicate the flag `?flat=true` to return only the output data.

### Retrieve WASM execution history

GET /v1/services/**{version_id}/history** - Retrieve the execution history of a
WASM module.

Additionally, it accepts query parameters to paginate the execution history:

- **page**: page number
- **limit**: number of records per page
- **order**: order of the records (asc or desc)

Response: **200-OK** / **400-Bad Request** / **404-Not Found**

```json
{
  "content": [
    {
      "version_id": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9",
      "inputs": {
        "AssessmentDate": "2022-08-31",
        "CashFlowTypes": "Level",
        "CCF": 0.551,
        "Contract_IR": 0.223,
        "LGD": 0.8095,
        "LoanLimit": 1200000,
        "NextPaymentDate": "2022-09-30",
        "ObligorRating": "D",
        "OutstandingBalance": 325000,
        "PaymentFreq": 12,
        "RecoveryLags": 10,
        "Segment": 1,
        "Stage_Regular": 2
      },
      "outputs": {
        "PVExpected": 740569.536244822,
        "ImpairmentRatio": 0.0642155769068361,
        "PDC": [
          {
            "1": 0.108,
            "13": 0.1108,
            "25": 0.11,
            "37": 0.107,
            "49": 0.103,
            "61": 0.0985,
            "73": 0.0939,
            "85": 0.0894,
            "97": 0.0851,
            "109": 0.081,
            "121": 0.0772,
            "133": 0.0737,
            "145": 0.0704,
            "157": 0.0674,
            "169": 0.0645,
            "181": 0.0618,
            "193": 0.0593,
            "205": 0.057,
            "217": 0.0547,
            "229": 0.0526,
            "241": 0.0506,
            "253": 0.0506,
            "265": 0.0506
          }
        ],
        "Final_ECL": 51829.9975109301,
        "ExpectedBehaviouralLife": 17,
        "GrossCarryingAmount": 807125,
        "PVContractual": 792399.533755752,
        "ContractualMaturityDate": "2024-01-31"
      },
      "executed_at": "2023-06-12T22:04:41.211Z",
      "execution_time": "398.11ms"
    },
    {
      "version_id": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9",
      "inputs": {
        "AssessmentDate": "2022-08-31",
        "CashFlowTypes": "Level",
        "CCF": 0.551,
        "Contract_IR": 0.223,
        "LGD": 0.8095,
        "LoanLimit": 1200000,
        "NextPaymentDate": "2022-09-30",
        "ObligorRating": "D",
        "OutstandingBalance": 325000,
        "PaymentFreq": 12,
        "RecoveryLags": 10,
        "Segment": 1,
        "Stage_Regular": 2
      },
      "outputs": {
        "PVExpected": 740569.536244822,
        "ImpairmentRatio": 0.0642155769068361,
        "PDC": [
          {
            "1": 0.108,
            "13": 0.1108,
            "25": 0.11,
            "37": 0.107,
            "49": 0.103,
            "61": 0.0985,
            "73": 0.0939,
            "85": 0.0894,
            "97": 0.0851,
            "109": 0.081,
            "121": 0.0772,
            "133": 0.0737,
            "145": 0.0704,
            "157": 0.0674,
            "169": 0.0645,
            "181": 0.0618,
            "193": 0.0593,
            "205": 0.057,
            "217": 0.0547,
            "229": 0.0526,
            "241": 0.0506,
            "253": 0.0506,
            "265": 0.0506
          }
        ],
        "Final_ECL": 51829.9975109301,
        "ExpectedBehaviouralLife": 17,
        "GrossCarryingAmount": 807125,
        "PVContractual": 792399.533755752,
        "ContractualMaturityDate": "2024-01-31"
      },
      "executed_at": "2023-06-12T22:04:45.949Z",
      "execution_time": "11.56ms"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 2,
    "total_items": 6,
    "total_pages": 3,
    "number_of_items": 2
  }
}
```

### Download an existing WASM module

GET /v1/services/**{version_id}** - Download an existing WASM module.

This endpoint is used to download an existing WASM module. The response will be
saved as a zip file.

Response: **200-OK** / **404-Not Found** / **422-Unprocessable Entity**

### Delete an existing WASM module

DELETE /v1/services/**{version_id}** - Delete an existing WASM module.

This endpoint is used to delete an existing WASM module to free up space. Both
the WASM module and its execution history will be deleted.

Response: **204-No Content** / **404-Not Found**

## Error handling

`ApiException` is a base class for all custom exceptions used to handle some basic
API errors. Using an `HttpException` filter, the error response is formatted as:

```json
{
  "error": {
    "status": 422,
    "message": "unable to fully process request",
    "cause": "description of the failure if any"
  }
}
```

Some of the derived exceptions are:

| type | status | when |
| ---- | ------ | ---- |
|`BadUploadWasmData`| 400 | wrong/missing params |
|`WasmFileNotFound`| 404 | unable to find WASM file records |
|`ExecHistoryNotFound`| 404 | unable to find its execution records |
|`WasmRecordNotSaved`| 422 | unable to save WASM file record |
|`ExecHistoryNotSaved`| 422 | unable to save WASM file |

## Conceptual references

### Workflow

The workflow for a WASM journey involves transferring a zip file through HTTP,
which is then saved as assets. These assets are later utilized to perform
sparkified calculations. A record of the upload process is stored in a CSV file
for future references and computations.

When an execution request is made, the WASM file is loaded into memory and
*cached until invalidated*.
The provided inputs and version ID are used to run the WASM, and the resulting output
is returned to the user. As the user submits multiple requests, records of those requests are
saved in a CSV file, which can be retrieved later as part of the API call history.

### Architecture and design

Under the hood, the service is composed of several layers that are responsible for
handling the different aspects of the service:

- **Application layer**: This layer manages the application logic and handles
  communication with the infrastructure layer. It processes HTTP requests and
  responses, and includes interceptors and filters.
- **Infrastructure layer**: The one is responsible for managing
  all aspects related to infrastructure, data persistence, and storage systems.
  This includes interactions with the file system and other relevant components.
- **Domain layer**: The domain layer handles the core business logic of the system.
  It encompasses the representation of entity models and encapsulates the operations
  and rules specific to the application domain.
- **Shared layer**: The shared layer contains commonalities and utilities that
  are shared across different layers of the system. It provides reusable components
  and functionalities to enhance the overall development and maintenance process.

### Service compliance and delivery

| feature | compliance |
| ------- | ---------- |
| basic documentation    | ✅ |
| api documentation      | ✅ |
| developer guide        | ✅ |
| usage and examples     | ✅ |
| release notes          | ✅ |
| - | - |
| versioning             | ✅ |
| UX/DX                  | ✅ |
| service level agreement| ✅ |
| - | - |
| devOps-ready           | ✅ |
| CI/CD-ready            | ✅ |
| - | - |
| RESTful API            | ✅ |
| version-controlled     | ✅ |
| clean code             | ✅ |
| modular                | ✅ |
| app config             | ✅ |
| logging                | ✅ |
| error handling         | ✅ |
| 5+ use cases           | ✅ |
| testing                | ❌ |
| linting                | ✅ |
| formatting             | ✅ |
| - | - |
| caching/memoization    | ✅ |
| file management        | ✅ |
| security layer         | ❌ |

<!-- References -->
[wasm-runner]: https://www.npmjs.com/package/@coherentglobal/wasm-runner "WASM Runner"
[wasm.org]: https://webassembly.org/ "Web Assembly Homepage"
[nodejs.org]: https://nodejs.org/en/download/ "Node.js Download Page"
