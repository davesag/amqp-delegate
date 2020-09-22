const amqp = require('amqplib')
const { v4 } = require('uuid')

const { QUEUE_NOT_STARTED, QUEUE_ALREADY_STARTED, NOT_CONNECTED } = require('./errors')
const defaults = require('./defaults')
const attachEvents = require('./attachEvents')
const invoker = require('./utils/invoker')

/**
 * Create a Job Delegator with the given options.
 * @param options
 *   - exchange The name of the service exchange (optional. Defaults to '')
 *   - url The url of the AQMP server to use.  (Optional. Defaults to 'amqp://localhost')
 *   - onError a hander to handle connection errors (optional)
 *   - onClose a handler to handle connection closed events (optional)
 * @return A Delegator
 */
const makeDelegator = (options = {}) => {
  const _options = {
    ...defaults,
    ...options
  }

  const { url, onError, onClose } = _options

  let connection
  let channel

  /**
   *  start the delegator, making it ready to invoke workers.
   */
  const start = async () => {
    if (channel) throw new Error(QUEUE_ALREADY_STARTED)
    connection = await amqp.connect(url)
    attachEvents(connection, { onError, onClose })

    channel = await connection.createChannel()
  }

  /**
   *  invoke the named worker with the given params.
   *  @param name - The name of the worker to invoke
   *  @param params - The params to pass to the worker
   *  @return a promise that resolves to the result of the worker's task.
   */
  const invoke = async (name, ...params) => {
    if (!channel) throw new Error(QUEUE_NOT_STARTED)
    const queue = await channel.assertQueue('', { exclusive: true })
    const correlationId = v4()
    const replyTo = queue.queue
    const invocation = invoker(correlationId, channel, replyTo)
    return invocation(name, params)
  }

  /**
   *  stops the delegator, disconnecting it from the amqp server
   *  and closing any channels.
   */
  const stop = async () => {
    if (!connection) throw new Error(NOT_CONNECTED)
    await channel.close()
    await connection.close()
    channel = undefined
    connection = undefined
  }

  return { start, invoke, stop }
}

module.exports = makeDelegator
