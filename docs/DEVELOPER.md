# Developer guide

This is the developer documentation for the `wasm-service` API. It dives into the
technical details of the service.

## Introduction

`wasm-service` is a sample RESTful API that enables you to run WASM modules generated
by Coherent Spark. It is built with [Node@16.14](https://nodejs.org/en/download)
and [NestJS@9.0](https://docs.nestjs.com/). Though it is built to be used as a
standalone service, this service is also microservice-friendly.

As NestJS's philosophy dictates, the service is built with modularity in mind.
It is composed of several modules that can be easily extended or updated to suit
your needs. Those modules are: `HealthModule`, `ServicesModule`, and `ConfigModule`.

Some other considered coding techniques and best practices are:

- [S.O.L.I.D.](https://en.wikipedia.org/wiki/SOLID) principles
- [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation) pattern
- [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Clean Code](https://en.wikipedia.org/wiki/Robert_C._Martin)
- [Semantic Versioning](https://semver.org/)
- [Docker](https://www.docker.com/)
- [OpenAPI](https://swagger.io/specification/) documentation

## Service roadmap

| feature | wasm-service | nodegen-server |
| ------- | ------------ | -------------- |
| basic documentation    | ✅ | ✅ |
| api documentation      | ✅ | ❌ |
| developer guide        | ✅ | ❌ |
| usage and examples     | ✅ | ❌ |
| release notes          | ✅ | ❌ |
| - | - | - |
| application type       | microservice | monolith |
| deps & vulnerabilities | 0 (zero) | :warning: |
| versioning             | ✅ | ❌ |
| UX and DX              | ✅ | ❌ |
| service level agreement| ✅ | ❌ |
| - | - | - |
| platform support       | arm64/amd64 | amd64 |
| devOps-ready           | ✅ | ✅ |
| CI/CD-ready            | ✅ | ❌ |
| - | - | - |
| RESTful API            | ✅ | ❌ |
| version-controlled     | ✅ | ✅ |
| clean code             | ✅ | ❌ |
| modular                | ✅ | ❌ |
| app config             | ✅ | ❌ |
| logging                | ✅ | ✅ |
| error handling         | ✅ | ✅ |
| use cases              | ✅ | ❌ |
| testing                | ❌ | ❌ |
| linting                | ✅ | ❌ |
| formatting             | ✅ | ❌ |
| - | - | - |
| caching/memoization    | ✅ | ❌ |
| DDD                    | ✅ | ❌ |
| file management        | ✅ | ✅ |
| secury layer           | ❌ | ❌ |

## Architecture and design

Under the hood, the service is composed of several layers that are responsible for
handling the different aspects of the service:

- **Application layer**: This layer is responsible for handling the application
  logic while maintaining the communication with the _infrastructure layer_. It
  is composed of modules and controllers.
- **Infrastructure layer**: This layer is responsible for handling the infrastructure
  logic. It is composed of models, mappers, and repositories. It is also responsible
  for handling the communication with the underlying storage system. In this case,
  the storage system is the file system.
- **Domain layer**: This layer handles the business logic. It is composed of entities,
  data transfer objects (dto) and CQRS funtionalities.
- **Shared layer**: This layer handles the shared logic between the different
  layers. It is composed of interfaces, enums, and utilities.

## API reference

The base URL for all the endpoints is `http://localhost:8080`.
See [Postman collection](postman-collection.json) for more details.

### Check health status

GET **/health** - Check the health status of the service.

This endpoint checks the following health indicators:

- **wasm data**: checks whether the WASM data storage exceeds a certain threshold.
- **disk storage**: checks whether the disk storage exceeds a certain threshold.
- **memory heap**: checks whether the memory heap exceeds a certain threshold.
- **memory rss**: checks whether the memory rss exceeds a certain threshold.

It can also be used by a Kubernetes cluster to determine whether the service is
up and running or not.

Response: **200 OK**

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
  "details": {
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
  }
}
```

### Upload WASM module

PUT /v1/services/**{version_id}/upload** - Upload a WASM bundle file.

Body: **multipart/form-data**

- **wasm**: WASM bundle file
- **data**: JSON payload that contains the metadata of the WASM module

This endpoint is used to upload a WASM bundle file to the service. The file is
then stored in the file system and the metadata is stored as part of csv file
for future references.

Response: **201 Created** / **400 Bad Request** / **500 Internal Server Error**

```json
{
  "version_id": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9",
  "file_name": "e57f48e7-fe8c-4202-b8bc-5d366cf1eee9.zip",
  "path": "uploads/e57f48e7-fe8c-4202-b8bc-5d366cf1eee9.zip",
  "original_name": "ExpectedCreditLossesModel.zip",
  "size": 432451,
  "uploaded_at": 1686804536700,
  "service_name": "expected-loss",
  "revision": "0.3.0",
  "username": "john.doe@coherent.global"
}
```

### Execute a WASM module

POST /v1/services/**{version_id}/execute** - Execute a WASM module.

Body: **application/json**

- **inputs**: JSON payload that contains the input data for the WASM module to
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

This endpoint is used to execute a WASM module. It takes a JSON payload that
contains the input data for the WASM module. Once executed, the WASM module will
return a JSON payload that contains the output data.

Response: **200 OK** / **400 Bad Request**

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

### Retrieve WASM execution history

GET /v1/services/**{version_id}/history** - Retrieve the execution history of a
WASM module.

This endpoint is used to retrieve the execution history of a WASM module. Additionally,
it accepts query parameters to paginate the execution history.

Query parameters:

- **page**: page number
- **limit**: number of records per page
- **order**: order of the records (asc or desc)

Response: **200 OK**

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

GET /v1/services/**{version_id}/download** - Download an existing WASM module.

This endpoint is used to download an existing WASM module. The response will be
saved as zip file.

### Delete an existing WASM module

DELETE /v1/services/**{version_id}** - Delete an existing WASM module.

This endpoint is used to delete an existing WASM module to free up space. Both
the WASM module and its execution history will be deleted.

Response: **204 No Content**
