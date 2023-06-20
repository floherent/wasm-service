# Developer guide

This developer documentation dives into technical details of the `wasm-service`,
including its scope, its API reference and more.

This guide will walk you through:

- a reference implementation for running the [Web Assembly][wasm.org] (WASM)
  module, also known as *offline deployments*,
- and the steps that help you set up a development environment and extend the
  service's functionality to suit your needs.

## Introduction

`wasm-service` is a sample RESTful API that lets you run WASM modules generated
by Coherent Spark. It is built with [Node@16.14](https://nodejs.org/en/download)
and [NestJS@9.0](https://docs.nestjs.com/). Though it is built to be used as a
standalone service, this service is also microservice-friendly.

As NestJS's philosophy dictates, the service is built with modularity in mind.
It is composed of several modules that can be easily extended or updated to suit
your needs. Those modules are: `HealthModule`, `ServicesModule`, and `ConfigModule`.

The `ServicesModule` is a simple module that exposes a few endpoints, among them,
one that relies heavily on the [@coherentglobal/spark-execute-sdk][spark-sdk]
Node.js package's core logic.

Some other coding techniques and best practices considered throughout this service
implementation are:

- [S.O.L.I.D.](https://en.wikipedia.org/wiki/SOLID)
- [CQRS](https://en.wikipedia.org/wiki/Command%E2%80%93query_separation)
- [DDD](https://en.wikipedia.org/wiki/Domain-driven_design)
- [Clean Code](https://en.wikipedia.org/wiki/Robert_C._Martin)
- [Semantic Versioning](https://semver.org/)
- [Docker](https://www.docker.com/)
- [OpenAPI](https://swagger.io/specification/)

## Getting started

What you will need to get started:

1. choose an IDE or text editor
2. have a copy of this repository
3. set up your development environment
4. download the WASM from Spark
5. execute the WASM offline.

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

## Download the WASM from Spark

Once logged into Spark, navigate to the service you would like to execute offline.

- From the folder page in Spark: select the service > click the 3-dot menu >
  click on **View in File Manager**.
- Once the file manager page is loaded, locate **your-service.zip** among a list
  of files related to your service, click the 3-dot menu and select **Download**.

If you would like to check if you got the correct zip file, you can unzip it and
make sure the following files are present:

- `your-service.wasm`
- `your-service.data`
- `your-service.js`
- and some other files (e.g. checksums, etc.)

> Please write down the `versionId` of the WASM that you downloaded since you will
> be needing it as a unique identifier to execute the WASM.
> You may choose to use the [wasm file](../examples/ExpectedCreditLossesModel.zip)
> (and its versionId: `e57f48e7-fe8c-4202-b8bc-5d366cf1eee9`) provided in this
> repository as well.

### Execute the WASM offline

See the [Execute a WASM module](#execute-a-wasm-module) in the
[API reference](#api-reference) section for more details.

## API reference

The base URL for all the endpoints is `http://localhost:8080`.
See the [Postman collection](postman-collection.json) for more details.

### Check health status

GET **/health** - Check the health status of the service.

This endpoint checks the following health indicators:

- **wasm data**: indicates whether the WASM data storage exceeds a certain threshold.
- **disk storage**: indicates whether the disk storage exceeds a certain threshold.
- **memory heap**: indicates whether the memory heap exceeds a certain threshold.
- **memory rss**: indicates whether the memory rss exceeds a certain threshold.

It can also be used by a Kubernetes cluster to determine whether the service is
up and running or not.

Response: **200 OK** / **503 Service Unavailable**

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

PUT /v1/services/**{version_id}** - Upload a WASM bundle file.

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

GET /v1/services/**{version_id}** - Download an existing WASM module.

This endpoint is used to download an existing WASM module. The response will be
saved as zip file.

### Delete an existing WASM module

DELETE /v1/services/**{version_id}** - Delete an existing WASM module.

This endpoint is used to delete an existing WASM module to free up space. Both
the WASM module and its execution history will be deleted.

Response: **204 No Content**

## Conceptual references

### Workflow

A WASM journey can be defined a zip file that's transferred through HTTP and gets
saved as assets, which will be later used to compute sparkified calculations.
A record of that upload process is saved in a csv file for future references and
computations.

Upon an execution request, this WASM will be loaded in memory (*also cached until invalidated*)
and become a Spark instance. And finally, the given inputs and versionId will be
used to run the WASM and the generated output will be returned to a user. As user
will be submitted several requests, records of those will be saved in a csv file
and may be retrieved later as part the API call history.

### Architecture and design

Under the hood, the service is composed of several layers that are responsible for
handling the different aspects of the service:

- **Application layer**: This layer handles the application logic and communicates
  with the *infrastructure layer*. That is, HTTP requests and responses are processed
  there as well as some interceptors/filters.
- **Infrastructure layer**: This layer handles anything related to infrastructure,
  data persitence and storage system (e.g, file system).
- **Domain layer**: This layer handles the business logic. It includes representations
  of entity models.
- **Shared layer**: This layer includes commonalities and utilities between the
  different layers.

### Service roadmap and delivery

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
| 5+ use cases           | ✅ | :warning: |
| testing                | ❌ | ❌ |
| linting                | ✅ | ❌ |
| formatting             | ✅ | ❌ |
| - | - | - |
| caching/memoization    | ✅ | ❌ |
| file management        | ✅ | ✅ |
| security layer         | ❌ | ❌ |

## Error handling

TBD.

## Troubleshooting

TBD.

<!-- References -->
[spark-sdk]: https://www.npmjs.com/package/@coherentglobal/spark-execute-sdk
[wasm.org]: https://webassembly.org/ "Web Assembly Homepage"
[nodejs.org]: https://nodejs.org/en/download/ "Node.js Download Page"
