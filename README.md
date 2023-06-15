# WASM Service

Standalone API service for running WebAssembly (or WASM) modules generated by
Coherent Spark.

## Disclaimer

The underlying content of this project comprises a sample service (**not** a
product) that demonstrates how to run WASM modules once _sparkified_. The codebase
should serve as a reference for developers who wish to integrate WASM modules into
their own applications.

## Getting started

This documentation assumes that you are a developer and are familiar with Coherent
Spark. If you are not, please visit the [User Guide][user-guide] site to learn
more about it.

Spark enables some powerful features for your Excel models. Among them figures
the ability to convert them to web assembly modules. That is, once an Excel model
is _sparkified_, Spark generates a WASM representation of that model that you can
later download and use in your own application independently.

Yes, that's right... the sky is the limit!

The following steps will guide you through the process of running the `wasm-service`
and executing that WASM module within your own application.

## Running the service

There are two ways to run this service:

- via Docker
- or using Node on your local machine

Choose the one that best suits your needs. Refer to the [Developer Guide](docs/DEVELOPER.md)
for more technical details.

### Running the service locally

This API service is built with [Node](https://nodejs.org) and [NestJS](https://nestjs.com/).
Instructions on how to install Node can be found on its official website.

Once Node is installed, clone this repository, install the dependencies and start
the service.

```bash
# install dependencies
$ npm install # or yarn

# start the development server
$ npm run start # or yarn start
```

### Launching the service via Docker

You can either build a docker image from the codebase (see [Dockerfile](Dockerfile))
or pull the docker image for this service directly from Docker hub. To run it,
you will need to have [Docker](https://www.docker.com/) installed on your machine.

```bash
# build docker image
$ docker image build -t wasm-service .

# run the service via docker
$ docker container run --name wasm-service -p 8080:8080 -d wasm-service
```

By default, the service will be available on port `8080`. You can change that
by modifying the [configuration](.config/config.yml) file.

## API reference

The `wasm-service` API covers five basic use cases to help you get started:

1. upload a WASM module: `PUT /v1/services/{version_id}/upload`
2. execute that WASM module: `POST /v1/services/{version_id}/execute`
3. get the WASM execution history: `GET /v1/services/{version_id}/history?page=1&limit=100`
4. download a WASM module: `GET /v1/services/{version_id}/download`
5. delete a WASM module: `DELETE /v1/services/{version_id}`

Additionally, the service includes a health check endpoint to verify that the
service is up and running: `GET /health`.

Find more details about the API endpoints from the [Postman collection](docs/postman-collection.json).

## Change log

See the [CHANGELOG.md](CHANGELOG.md) for all notable changes about this project.

## Support

Developed by [Coherent Global Inc][coherent-site].

Please contact <fieldengineering@coherent.global> with any questions.

## Copyright and license

TBD.

<!-- References -->

[coherent-site]: https://www.coherent.global
[user-guide]: https://coherent.gitbook.io/spark/T1wG85lxdoEsRrNQJvPj/
