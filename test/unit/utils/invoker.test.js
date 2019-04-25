const { expect } = require('chai')
const { stub, match, resetHistory } = require('sinon')
const proxyquire = require('proxyquire')

const { fakeChannel } = require('../fakes')

describe('utils/invoker', () => {
  const channel = fakeChannel()
  const messageCorrelator = stub()
  const correlationId = '12345'
  const name = 'some name'
  const param = 'some param'
  const replyTo = 'some replyTo address'

  const invoker = proxyquire('../../../src/utils/invoker', {
    './messageCorrelator': messageCorrelator
  })

  const invocation = invoker(correlationId, channel, replyTo)
  const message = 'a message'

  before(() => {
    messageCorrelator.returns(message)
    invocation(name, [param])
  })

  after(resetHistory)

  it('called the messageCorrelator with the expected values', () => {
    expect(messageCorrelator).to.have.been.calledWith(
      correlationId,
      match.func,
      match.func
    )
  })

  it('called channel.consume with the expected values', () => {
    expect(channel.consume).to.have.been.calledWith(replyTo, message, {
      noAck: true
    })
  })

  it('called channel.sendToQueue with the expected values', () => {
    expect(channel.sendToQueue).to.have.been.calledWith(
      name,
      Buffer.from(JSON.stringify([param])),
      { correlationId, replyTo }
    )
  })
})
