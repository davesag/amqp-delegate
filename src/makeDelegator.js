const amqp = require('amqplib')
const v4 = require('uuid/v4')

const {
  QUEUE_NOT_STARTED,
  QUEUE_ALREADY_STARTED,
  NOT_CONNECTED
} = require('./errors')
const defaults = require('./defaults')
const attachEvents = require('./attachEvents')

/**
 * Create a Job Delegator with the given options.
 * @param options
 *   - exchange The name of the service exchange (required)
 *   - url The url of the AQMP server to use.  Defaults to 'amqp://localhost'
 *   - onError a hander to handle connection errors (optional)
 *   - onClose a handler to handle connection closed events (optional)
 * @return A Delegator
 */
const makeDelegator = (options = {}) => {
  const _options = {
    ...defaults,
    ...options
  }

  const { exchange, url, onError, onClose } = _options

  let connection
  let channel
  let queue

  const start = async () => {
    if (channel) throw new Error(QUEUE_ALREADY_STARTED)
    connection = await amqp.connect(url)
    attachEvents(connection, { onError, onClose })

    channel = await connection.createChannel()
    queue = await channel.assertQueue(exchange, { exclusive: true })
  }

  const invoke = (name, ...params) =>
    new Promise((resolve, reject) => {
      if (!channel) return reject(QUEUE_NOT_STARTED)
      const buffer = Buffer.from(JSON.stringify(params))
      const correlationId = v4()
      const replyTo = queue.queue

      channel.consume(
        replyTo,
        message => {
          if (message.properties.correlationId === correlationId) {
            try {
              const result = JSON.parse(message.content.toString())
              return resolve(result)
            } catch (err) {
              return reject(err)
            }
          }
        },
        { noAck: true }
      )

      channel.sendToQueue(name, buffer, { correlationId, replyTo })
    })

  const stop = async () => {
    if (!connection) throw new Error(NOT_CONNECTED)
    if (!channel) throw new Error(QUEUE_NOT_STARTED)
    await channel.close()
    await connection.close()
    channel = undefined
    connection = undefined
    queue = undefined
  }

  return { start, invoke, stop }
}

module.exports = makeDelegator
