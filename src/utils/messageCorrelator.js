const { WRONG_CORRELATION_ID } = require('../errors')

const messageCorrelator = (correlationId, resolve, reject) => message => {
  if (message.properties.correlationId === correlationId) {
    try {
      const result = JSON.parse(message.content.toString())
      return resolve(result)
    } catch (err) {
      return reject(err)
    }
  }

  return reject(WRONG_CORRELATION_ID)
}

module.exports = messageCorrelator
