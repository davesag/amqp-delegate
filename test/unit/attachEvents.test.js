const { expect } = require('chai')
const { spy, resetHistory } = require('sinon')

const attachEvents = require('../../src/attachEvents')

describe('attachEvents', () => {
  const connection = {
    on: spy()
  }

  context('if handers are supplied', () => {
    const onError = () => {}
    const onClose = () => {}

    before(() => {
      attachEvents(connection, { onError, onClose })
    })

    after(resetHistory)

    it("attached the onError event handler to 'error'", () => {
      expect(connection.on).to.have.been.calledWith('error', onError)
    })

    it("attached the onClose event handler to 'close'", () => {
      expect(connection.on).to.have.been.calledWith('close', onClose)
    })
  })

  context('if handers are not supplied', () => {
    before(() => {
      attachEvents(connection, {})
    })

    after(resetHistory)

    it("didn't attach any event handlers", () => {
      expect(connection.on).not.to.have.been.called
    })
  })
})
