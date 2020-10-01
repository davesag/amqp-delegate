const { WRONG_CORRELATION_ID } = require('../errors')

/**
 *  The messageCorrelator returns a function that checks the message's correlationId to see
 *  if it matches the one it's expecting.
 *
 *  If they do not match then the function does nothing.
 *
 *  If they do match then the function attempts to parse the message content and resolve with
 *  the result.  If parsing fails it will reject with the error.
 *
 *  @param {string} correlationId The ID you are waiting on
 *  @param {Function} resolve The a resolve function
 *  @param {Function} reject The a reject function
 *  @returns Function that correlates the received message with the curried correlationId.
 */
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
