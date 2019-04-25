const { expect } = require('chai')
const { stub, resetHistory } = require('sinon')

const messageCorrelator = require('../../../src/utils/messageCorrelator')

const { WRONG_CORRELATION_ID } = require('../../../src/errors')

describe('utils/messageCorrelator', () => {
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'
  const resolve = stub().returns(RESOLVED)
  const reject = stub().returns(REJECTED)
  const correlationId = '123456'
  const content = { test: 'data', is: 'good data' }

  const correlate = messageCorrelator(correlationId, resolve, reject)
  let result

  context('given matching correlationId', () => {
    context('given unparsable message content', () => {
      const message = {
        properties: {
          correlationId
        },
        content: 'junk'
      }

      before(() => {
        result = correlate(message)
      })

      after(resetHistory)

      it('invoked reject with a SyntaxError', () => {
        expect(reject).to.have.been.called
        const err = reject.firstCall.args[0]
        expect(err).to.be.instanceof(SyntaxError)
      })

      it('returned the evaluated rejection', () => {
        expect(result).to.equal(REJECTED)
      })
    })

    context('given parsable message content', () => {
      const message = {
        properties: {
          correlationId
        },
        content: JSON.stringify(content)
      }

      before(() => {
        result = correlate(message)
      })

      after(resetHistory)

      it('invoked resolve with parsed content', () => {
        expect(resolve).to.have.been.calledWith(content)
      })

      it('returned the evaluated rejection', () => {
        expect(result).to.equal(RESOLVED)
      })
    })
  })

  context('given non-matching correlationId', () => {
    const message = {
      properties: {
        correlationId: 'some-other-id'
      },
      content: JSON.stringify(content)
    }

    before(() => {
      result = correlate(message)
    })

    after(resetHistory)

    it('invoked reject with WRONG_CORRELATION_ID', () => {
      expect(reject).to.have.been.calledWith(WRONG_CORRELATION_ID)
    })

    it('returned the evaluated rejection', () => {
      expect(result).to.equal(REJECTED)
    })
  })
})
