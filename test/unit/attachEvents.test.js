const { expect } = require('chai')
const { spy } = require('sinon')

const attachEvents = require('../../src/attachEvents')

describe('attachEvents', () => {
  const connection = {
    on: spy()
  }

  const onError = () => {}
  const onClose = () => {}

  before(() => {
    attachEvents(connection, { onError, onClose })
  })

  it("attached the onError event handler to 'error'", () => {
    expect(connection.on).to.have.been.calledWith('error', onError)
  })

  it("attached the onClose event handler to 'close'", () => {
    expect(connection.on).to.have.been.calledWith('close', onClose)
  })
})
