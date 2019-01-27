const attachEvents = (connection, { onError, onClose }) => {
  const attach = (event, handler) => {
    if (typeof handler === 'function') connection.on(event, handler)
  }

  attach('error', onError)
  attach('close', onClose)
}

module.exports = attachEvents
