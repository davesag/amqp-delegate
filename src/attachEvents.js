/**
 *  Attaches onError and onClose event handlers
 *  to the supplied connection.
 *
 *  @param connection - An amqp connection
 *  @param handlers - The onError and onClose event handler functions.
 */
const attachEvents = (connection, { onError, onClose }) => {
  const attach = (event, handler) => {
    if (typeof handler === 'function') connection.on(event, handler)
  }

  attach('error', onError)
  attach('close', onClose)
}

module.exports = attachEvents
