const { expect } = require('chai')
const { stub, match, resetHistory } = require('sinon')
const proxyquire = require('proxyquire')

const { fakeChannel, fakeConnection, mockAmqplib } = require('./fakes')

const {
  NAME_MISSING,
  NOT_CONNECTED,
  QUEUE_ALREADY_STARTED,
  TASK_MISSING
} = require('../../src/errors')

describe('makeWorker', () => {
  const amqplib = mockAmqplib()
  const name = 'worker'
  const task = stub()
  const attachEvents = stub()
  const taskRunner = stub()

  const makeWorker = proxyquire('../../src/makeWorker', {
    amqplib,
    './attachEvents': attachEvents,
    './utils/taskRunner': taskRunner
  })

  const url = 'amqp://localhost'
  const onError = () => {}
  const onClose = () => {}

  let worker
  let channel
  let connection

  context('create a worker', () => {
    after(resetHistory)

    context('with missing name', () => {
      it('throws NAME_MISSING', () => expect(() => makeWorker({ task })).to.throw(NAME_MISSING))
    })

    context('with missing task', () => {
      it('throws TASK_MISSING', () => expect(() => makeWorker({ name })).to.throw(TASK_MISSING))
    })

    context('with valid params', () => {
      const hasFunction = fn => prop => {
        it(`has function ${prop}`, () => {
          expect(fn).has.property(prop)
          expect(fn[prop]).is.a('function')
        })
      }
      worker = makeWorker({ name, task })

      it('created a worker', () => {
        expect(worker).to.exist
      })
      ;['start', 'stop'].forEach(hasFunction(worker))
    })
  })

  describe('start', () => {
    const runner = stub()

    before(async () => {
      worker = makeWorker({ name, task, url, onError, onClose })
      channel = fakeChannel()
      connection = fakeConnection()
      channel.assertQueue.resolves()
      connection.createChannel.resolves(channel)
      amqplib.connect.resolves(connection)
      taskRunner.returns(runner)
      await worker.start()
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

    it('asserted the queue', () => {
      expect(channel.assertQueue).to.have.been.calledOnceWith(name, {
        durable: false
      })
    })

    it('throws QUEUE_ALREADY_STARTED if you try and start it again', () =>
      expect(worker.start()).to.be.rejectedWith(QUEUE_ALREADY_STARTED))

    it('called channel.prefetch with value 1', () => {
      expect(channel.prefetch).to.have.been.calledWith(1)
    })

    it('invoked the taskRunner', () => {
      expect(taskRunner).to.have.been.calledWith(channel, task)
    })

    it('called channel.consume with the correct values', () => {
      expect(channel.consume).to.have.been.calledWith(name, runner)
    })
  })

  describe('stop', () => {
    context('before the worker was started', () => {
      before(() => {
        worker = makeWorker({ name, task })
      })
      after(resetHistory)

      it('throws NOT_CONNECTED', () => expect(worker.stop()).to.be.rejectedWith(NOT_CONNECTED))
    })

    context('after the worker was started', () => {
      before(async () => {
        worker = makeWorker({ name, task })
        channel = fakeChannel()
        connection = fakeConnection()
        channel.assertQueue.resolves()
        channel.close.resolves()
        connection.createChannel.resolves(channel)
        amqplib.connect.resolves(connection)
        await worker.start()
        await worker.stop()
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
})
