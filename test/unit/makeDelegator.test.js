const { expect } = require('chai')
const { stub, match, resetHistory } = require('sinon')
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
  const correlationId = '12345'
  const v4 = () => correlationId
  const exchange = 'test'
  const attachEvents = stub()
  const invoker = stub()

  const makeDelegator = proxyquire('../../src/makeDelegator', {
    amqplib,
    uuid: { v4 },
    './attachEvents': attachEvents,
    './utils/invoker': invoker
  })

  const url = 'amqp://localhost'
  const onError = () => {}
  const onClose = () => {}

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

    after(resetHistory)

    it('created a delegator', () => {
      expect(delegator).to.exist
    })
    ;['start', 'stop', 'invoke'].forEach(hasFunction(delegator))
  })

  describe('start', () => {
    before(async () => {
      queue = fakeQueue()
      delegator = makeDelegator({ url, exchange, onClose, onError })
      channel = fakeChannel()
      connection = fakeConnection()
      connection.createChannel.resolves(channel)
      amqplib.connect.resolves(connection)
      await delegator.start()
    })

    after(resetHistory)

    it('connected', () => {
      expect(amqplib.connect).to.have.been.calledWith(url)
    })

    it('attached events', () => {
      expect(attachEvents).to.have.been.calledWith(
        connection,
        match({
          onError,
          onClose
        })
      )
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

      after(resetHistory)

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

      after(resetHistory)

      it('closed the channel', () => {
        expect(channel.close).to.have.been.calledOnce
      })

      it('closed the connection', () => {
        expect(connection.close).to.have.been.calledOnce
      })
    })
  })

  describe('invoke', () => {
    const invocation = stub()

    context('before the delegator was started', () => {
      before(() => {
        delegator = makeDelegator({ exchange })
      })

      after(resetHistory)

      it('throws QUEUE_NOT_STARTED', () =>
        expect(delegator.invoke()).to.be.rejectedWith(QUEUE_NOT_STARTED))
    })

    context('after the delegator was started', () => {
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
        invocation.resolves()
        invoker.returns(invocation)
        await delegator.invoke(name, param)
      })

      after(resetHistory)

      it('called channel.assertQueue with the correct params', () => {
        expect(channel.assertQueue).to.have.been.calledWith('', {
          exclusive: true
        })
      })

      it('called the invoker with the correct params', () => {
        expect(invoker).to.have.been.calledWith(
          correlationId,
          channel,
          queue.queue
        )
      })

      it('called invocation with the correct params', () => {
        expect(invocation).to.have.been.calledWith(name, [param])
      })
    })
  })
})
