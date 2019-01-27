# amqp-delegate

A very simplistic, but performant, remote worker system that uses AMQP to coordinate jobs.

## Worker

```
const { makeWorker } = require('amqp-delegate')

const worker = makeWorker({
  url: <the url of the amqp server - defaults to ampq://localhost,
  name: <the name of the worker>,
  task: <any pure async function>
})

// start it
worker.start().then(() => {
  console.log('worker', worker.name, 'started')
})

// stop it
worker.stop().then(() => {
  console.log('worker', worker.name, 'stopped')
})
```

## Delegator

```
const { makeDelegator } = require('amqp-delegate')

const delegator = makeWorker({
  url: <the url of the amqp server - defaults to ampq://localhost,
})

delegator
  .start()
  .then(() => {
    delegator.invoke('worker name', ...params)
    console.log('job name', result)
  })
  .catch(err => {
    console.error('worker name', err)
  })
```

## TODO

* error handling
* unit tests
* documentation
* publish to npm

## Development

### Prerequisites

* [NodeJS](htps://nodejs.org), version 10.15.0 or better (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
* [Docker](https://www.docker.com) (Use [Docker for Mac](https://docs.docker.com/docker-for-mac/), not the homebrew version)

### Initialisation

    npm install

### To Start the queue server for integration testing.

    docker-compose up -d

Runs Rabbit MQ.

### Test it

* `npm test` — runs the unit tests (quick and does not need rabbit mq running)
* `npm run test:integration` — runs the integration tests (not so quick and needs rabbitmq running)

### Lint it

    npm run lint

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
