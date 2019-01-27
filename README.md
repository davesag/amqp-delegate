# amqp-delegate

A very simplistic, but performant, remote worker system that uses AMQP to coordinate jobs.

[![Greenkeeper badge](https://badges.greenkeeper.io/davesag/amqp-delegate.svg)](https://greenkeeper.io/)

| branch | status | coverage | notes |
| ------ | ------ | -------- | ----- |
| `develop` | [![CircleCI](https://circleci.com/gh/davesag/amqp-delegate/tree/develop.svg?style=svg)](https://circleci.com/gh/davesag/amqp-delegate/tree/develop) | [![codecov](https://codecov.io/gh/davesag/amqp-delegate/branch/develop/graph/badge.svg)](https://codecov.io/gh/davesag/amqp-delegate) | Work in progress |
| `master` | [![CircleCI](https://circleci.com/gh/davesag/amqp-delegate/tree/master.svg?style=svg)](https://circleci.com/gh/davesag/amqp-delegate/tree/master) | [![codecov](https://codecov.io/gh/davesag/amqp-delegate/branch/master/graph/badge.svg)](https://codecov.io/gh/davesag/amqp-delegate) | Latest stable release |

## Worker

```
const { makeWorker } = require('amqp-delegate')

const worker = makeWorker({
  url: <the url of the amqp server> - defaults to ampq://localhost,
  name: <the name of the worker> — required,
  task: <any pure async function> — required
  onError: err => { // optional
    console.error('A connection error happened', err) // or do something clever
  }
  onClose: () => { // optional
    console.log('The connection has closed.') // or do something clever
  }
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
  exchange: <the name of the exchange to use> — defaults to '',
  url: <the url of the amqp server> - defaults to ampq://localhost,
  onError: err => { // optional
    console.error('A connection error happened', err) // or do something clever
  }
  onClose: () => { // optional
    console.log('The connection has closed.') // or do something clever
  }
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

## A concrete example

### The worker

```
const task = (a, b) =>
  new Promise(resolve => setTimeout(() => resolve(a + b), 10))

const worker = makeWorker({
  name: 'adder',
  task
})

worker
  .start()
  .then(() => {
    process.on('SIGINT', () => {
      worker
        .stop()
        .then(() => {
          process.exit(0)
        })
    })
  })
  .catch(err => {
    console.error('caught', err)
  })
```

### The delegator

```
const delegator = makeDelegator()

delegator
  .start()
  .then(() => delegator.invoke('adder', 10, 15))
  .then(result => {
    console.log('result', result)
  })
  .catch(err => {
    console.error('caught', err)
  })
```

## TODO

* documentation
* publish to npm

## Development

### Prerequisites

* [NodeJS](htps://nodejs.org), version 10.15.0 or better (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
* [Docker](https://www.docker.com) (Use [Docker for Mac](https://docs.docker.com/docker-for-mac/), not the homebrew version)

### Initialisation

```
npm install
```

### To Start the queue server for integration testing.

```
docker-compose up -d
```

Runs Rabbit MQ.

### Test it

* `npm test` — runs the unit tests (does not need rabbitmq)
* `npm run test:unit:cov` — runs the unit tests with code coverage (does not need rabbitmq)
* `npm run test:integration` — runs the integration tests (needs rabbitmq)

**note** Node 11.7+ breaks `nyc` and `mocha` — see https://github.com/nodejs/node/issues/25650

### Lint it

```
npm run lint
```

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
