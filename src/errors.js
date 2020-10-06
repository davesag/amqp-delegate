const ERRORS = {
  EXCHANGE_MISSING: 'You must supply an exchange name in the options',
  NAME_MISSING: 'You must provide a worker name in the options',
  NOT_CONNECTED: 'You are not connected to an AMQP server',
  QUEUE_ALREADY_STARTED: 'Message Queue has already been started',
  QUEUE_NOT_STARTED: 'Message Queue has not been started',
  TASK_MISSING: 'You must provide an async pure function as a task for the worker to perform',
  WRONG_CORRELATION_ID: 'The provided correlationId is incorrect'
}

module.exports = ERRORS
