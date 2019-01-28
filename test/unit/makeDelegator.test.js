const { expect } = require('chai')
const { match } = require('sinon')

const proxyquire = require('proxyquire')
const {
  fakeQueue,
  fakeChannel,
  fakeConnection,
  mockAmqplib
} = require('./fakes')
const {
  QUEUE_NOT_STARTED,
  QUEUE_ALREADY_STARTED,
  NOT_CONNECTED
} = require('../../src/errors')

describe('makeDelegator', () => {
  const amqplib = mockAmqplib()
  const v4 = () => '12345'
  const exchange = 'test'

  const makeDelegator = proxyquire('../../src/makeDelegator', {
    amqplib,
    'uuid/v4': v4
  })
  let delegator
  let channel
  let connection
  let queue

  context('create a delegator', () => {
    const hasFunction = del => prop => {
      it(`has function ${prop}`, () => {
        expect(del).has.property(prop)
        expect(del[prop]).is.a('function')
      })
    }
    delegator = makeDelegator()

    it('created a delegator', () => {
      expect(delegator).to.exist
    })
    ;['start', 'stop', 'invoke'].forEach(hasFunction(delegator))
  })

  describe('start', () => {
    before(async () => {
      queue = fakeQueue()
      delegator = makeDelegator({ exchange })
      channel = fakeChannel()
      connection = fakeConnection()
      connection.createChannel.resolves(channel)
      amqplib.connect.resolves(connection)
      await delegator.start()
    })

    it('connected', () => {
      expect(amqplib.connect).to.have.been.calledOnce
    })

    it('created a channel', () => {
      expect(connection.createChannel).to.have.been.calledOnce
    })

    it('throws QUEUE_ALREADY_STARTED if you try and start it again', () =>
      expect(delegator.start()).to.be.rejectedWith(QUEUE_ALREADY_STARTED))
  })

  describe('stop', () => {
    context('before the delegator was started', () => {
      before(() => {
        delegator = makeDelegator({ exchange })
      })

      it('throws NOT_CONNECTED', () =>
        expect(delegator.stop()).to.be.rejectedWith(NOT_CONNECTED))
    })

    context('after the delegator was started', () => {
      before(async () => {
        delegator = makeDelegator({ exchange })
        channel = fakeChannel()
        connection = fakeConnection()
        channel.close.resolves()
        connection.createChannel.resolves(channel)
        amqplib.connect.resolves(connection)
        await delegator.start()
        await delegator.stop()
      })

      it('closed the channel', () => {
        expect(channel.close).to.have.been.calledOnce
      })

      it('closed the connection', () => {
        expect(connection.close).to.have.been.calledOnce
      })
    })
  })

  describe('invoke', () => {
    context('before the delegator was started', () => {
      before(() => {
        delegator = makeDelegator({ exchange })
      })

      it('throws QUEUE_NOT_STARTED', () =>
        expect(delegator.invoke()).to.be.rejectedWith(QUEUE_NOT_STARTED))
    })

    // TODO: work out how to test the channel.consume callback
    context.skip('after the delegator was started', () => {
      const name = 'some name'
      const param = 'some param'

      before(async () => {
        queue = fakeQueue()
        delegator = makeDelegator({ exchange })
        channel = fakeChannel()
        connection = fakeConnection()
        channel.assertQueue.resolves(queue)
        connection.createChannel.resolves(channel)
        amqplib.connect.resolves(connection)
        await delegator.start()
        await delegator.invoke(name, param)
      })

      it('called channel.consume', () => {
        expect(channel.consume).to.have.been.calledWith(
          queue.queue,
          match.func,
          match({ noAck: true })
        )
      })
    })
  })
})
