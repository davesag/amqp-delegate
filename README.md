# amqp-delegate

A remote worker system that uses `AMQP` to coordinate jobs.

[![NPM](https://nodei.co/npm/amqp-delegate.png)](https://nodei.co/npm/amqp-delegate/)

## See Also

- [`amqp-simple-pub-sub`](https://github.com/davesag/amqp-simple-pub-sub) — A library that simplifies use of `AMQP` based publishers and subscribers.

## Usage

```sh
npm install amqp-delegate
```

## Worker

```js
const { makeWorker } = require('amqp-delegate')

const worker = makeWorker({
  url: 'ampq://localhost:5672', // the default
  name: 'the name of the worker', // required
  task: async () => 'any pure async function', // required
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

```js
const { makeDelegator } = require('amqp-delegate')

const delegator = makeWorker({
  url: 'ampq://localhost:5672', // the default
  onError: err => { // optional
    console.error('A connection error happened', err) // or something clever
  }
  onClose: () => { // optional
    console.log('The connection has closed.') // or something clever
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

```js
const { makeWorker } = require('amqp-delegate')

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
      worker.stop().then(() => {
        process.exit(0)
      })
    })
  })
  .catch(err => {
    console.error('caught', err)
  })
```

### The delegator

```js
const { makeDelegator } = require('amqp-delegate')

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

## Development

[![Greenkeeper badge](https://badges.greenkeeper.io/davesag/amqp-delegate.svg)](https://greenkeeper.io/)

<!-- prettier-ignore -->
| branch | status | coverage | Audit | notes |
| ------ | ------ | -------- | ----- | ----- |
| `develop` | [![CircleCI](https://circleci.com/gh/davesag/amqp-delegate/tree/develop.svg?style=svg)](https://circleci.com/gh/davesag/amqp-delegate/tree/develop) | [![codecov](https://codecov.io/gh/davesag/amqp-delegate/branch/develop/graph/badge.svg)](https://codecov.io/gh/davesag/amqp-delegate) | [![Vulnerabilities](https://snyk.io/test/github/davesag/amqp-delegate/develop/badge.svg)](https://snyk.io/test/github/davesag/amqp-delegate/develop) | Work in progress |
| `master` | [![CircleCI](https://circleci.com/gh/davesag/amqp-delegate/tree/master.svg?style=svg)](https://circleci.com/gh/davesag/amqp-delegate/tree/master) | [![codecov](https://codecov.io/gh/davesag/amqp-delegate/branch/master/graph/badge.svg)](https://codecov.io/gh/davesag/amqp-delegate) | [![Vulnerabilities](https://snyk.io/test/github/davesag/amqp-delegate/master/badge.svg)](https://snyk.io/test/github/davesag/amqp-delegate/master) | Latest stable release |

### Prerequisites

- [NodeJS](htps://nodejs.org), version 8.10.0 or better (I use [`nvm`](https://github.com/creationix/nvm) to manage Node versions — `brew install nvm`.)
- [Docker](https://www.docker.com) (Use [Docker for Mac](https://docs.docker.com/docker-for-mac/), not the homebrew version)

### Initialisation

```sh
npm install
```

### To Start the queue server for integration testing.

```sh
docker-compose up -d
```

Runs Rabbit MQ.

### Test it

- `npm test` — runs the unit tests (does not need `rabbitmq`)
- `npm run test:unit:cov` — runs the unit tests with code coverage (does not need `rabbitmq`)
- `npm run test:integration` — runs the integration tests (needs `rabbitmq`)
- `npm run test:mutants` — runs the mutation tests (does not need `rabbitmq`)

### Lint it

```sh
npm run lint
```

## Contributing

Please see the [contributing notes](CONTRIBUTING.md).
