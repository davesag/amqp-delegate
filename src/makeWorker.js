const amqp = require('amqplib')
const {
  NAME_MISSING,
  NOT_CONNECTED,
  QUEUE_ALREADY_STARTED,
  QUEUE_NOT_STARTED,
  TASK_MISSING
} = require('./errors')
const defaults = require('./defaults')

/**
 * Create a Worker with the given options.
 * @param options
 *   - exchange The name of the service exchange (required)
 *   - name The name of the worker. (required)
 *   - task A pure async function that does the work
 *   - url The url of the AQMP server to use.  Defaults to 'amqp://localhost'
 *   - onError a hander to handle connection errors (optional)
 *   - onClose a handler to handle connection closed events (optional)
 * @return A Worker
 */
const makeWorker = options => {
  const _options = {
    ...defaults,
    ...options
  }

  const { name, task, url } = _options

  if (!name) throw new Error(NAME_MISSING)
  if (typeof task !== 'function') throw new Error(TASK_MISSING)

  let connection
  let channel

  const start = async () => {
    if (channel) throw new Error(QUEUE_ALREADY_STARTED)
    connection = await amqp.connect(url)
    channel = await connection.createChannel()
    channel.assertQueue(name, { durable: false })
    channel.prefetch(1)
    console.log('Worker', name, 'is awaiting requests')

    channel.consume(
      name,
      message =>
        new Promise((resolve, reject) => {
          let params
          try {
            params = JSON.parse(message.content.toString())
            console.log('Got params', params)
          } catch (err) {
            channel.ack(message)
            return reject(err)
          }

          task(...params)
            .then(result => {
              channel.sendToQueue(
                message.properties.replyTo,
                Buffer.from(JSON.stringify(result)),
                { correlationId: message.properties.correlationId }
              )

              channel.ack(message)
              return resolve(result)
            })
            .catch(err => {
              channel.ack(message)
              return reject(err)
            })
        })
    )
  }

  const stop = async () => {
    if (!channel) throw new Error(QUEUE_NOT_STARTED)
    if (!connection) throw new Error(NOT_CONNECTED)
    await channel.close()
    await connection.close()
    channel = undefined
    connection = undefined
  }

  return { start, stop }
}

module.exports = makeWorker
