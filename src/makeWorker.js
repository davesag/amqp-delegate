const amqp = require('amqplib')
const { NAME_MISSING, NOT_CONNECTED, QUEUE_ALREADY_STARTED, TASK_MISSING } = require('./errors')
const defaults = require('./defaults')
const attachEvents = require('./attachEvents')
const taskRunner = require('./utils/taskRunner')

/**
 * Create a Worker with the given options.
 * @param options
 *   - name The name of the worker. (required)
 *   - task A pure async function that does the work (required)
 *   - url The url of the AQMP server to use.  (optional, defaults to 'amqp://localhost')
 *   - onError a hander to handle connection errors (optional)
 *   - onClose a handler to handle connection closed events (optional)
 * @return A Worker
 */
const makeWorker = options => {
  const _options = {
    ...defaults,
    ...options
  }

  const { name, task, url, onError, onClose } = _options

  if (!name) throw new Error(NAME_MISSING)
  if (typeof task !== 'function') throw new Error(TASK_MISSING)

  let connection
  let channel

  /**
   *  starts the worker.
   */
  const start = async () => {
    if (channel) throw new Error(QUEUE_ALREADY_STARTED)
    connection = await amqp.connect(url)
    attachEvents(connection, { onError, onClose })

    channel = await connection.createChannel()
    await channel.assertQueue(name, { durable: false })
    channel.prefetch(1)

    channel.consume(name, taskRunner(channel, task))
  }

  /**
   *  stops the worker.
   */
  const stop = async () => {
    if (!connection) throw new Error(NOT_CONNECTED)
    await channel.close()
    await connection.close()
    channel = undefined
    connection = undefined
  }

  return { start, stop }
}

module.exports = makeWorker
