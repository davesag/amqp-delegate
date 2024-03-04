const { expect } = require('chai')
const { stub, resetHistory } = require('sinon')
const taskRunner = require('../../../src/utils/taskRunner')

const { fakeChannel } = require('../fakes')

describe('utils/taskRunner', () => {
  const task = stub()
  const channel = fakeChannel()
  const runner = taskRunner(channel, task)
  const correlationId = '12345'
  const replyTo = 'me over here'
  const expected = 'some response'

  context('message content is valid json', () => {
    const params = ['some param']
    const content = Buffer.from(JSON.stringify(params))

    const message = { properties: { correlationId, replyTo }, content }

    let result

    before(async () => {
      task.resolves(expected)
      channel.sendToQueue.resolves()
      result = await runner(message)
    })

    after(resetHistory)

    it('invoked the task with the params', () => {
      expect(task).to.have.been.calledWith(...params)
    })

    it('called channel.sendToQueue with the right values', () => {
      expect(channel.sendToQueue).to.have.been.calledWith(
        replyTo,
        Buffer.from(JSON.stringify(expected)),
        { correlationId }
      )
    })

    it('acked the message', () => {
      expect(channel.ack).to.have.been.calledWith(message)
    })

    it('returned the expected response', () => {
      expect(result).to.equal(expected)
    })
  })

  context('message content is not valid json', () => {
    const content = Buffer.from('some nonsense')

    const message = { properties: { correlationId, replyTo }, content }
    let error

    before(async () => {
      try {
        await runner(message)
      } catch (err) {
        error = err
      }
    })

    it('threw an error', () => expect(error).not.to.be.undefined)
  })
})
