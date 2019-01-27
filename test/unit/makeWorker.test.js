const { expect } = require('chai')
const { stub } = require('sinon')

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

  const makeWorker = proxyquire('../../src/makeWorker', { amqplib })
  let worker
  let channel
  let connection

  context('create a worker', () => {
    context('with missing name', () => {
      it('throws NAME_MISSING', () =>
        expect(() => makeWorker({ task })).to.throw(NAME_MISSING))
    })

    context('with missing task', () => {
      it('throws TASK_MISSING', () =>
        expect(() => makeWorker({ name })).to.throw(TASK_MISSING))
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
    before(async () => {
      worker = makeWorker({ name, task })
      channel = fakeChannel()
      connection = fakeConnection()
      channel.assertQueue.resolves()
      connection.createChannel.resolves(channel)
      amqplib.connect.resolves(connection)
      await worker.start()
    })

    it('connected', () => {
      expect(amqplib.connect).to.have.been.calledOnce
    })

    it('created a channel', () => {
      expect(connection.createChannel).to.have.been.calledOnce
    })

    it('asserted the queue', () => {
      expect(channel.assertQueue).to.have.been.calledOnce
    })

    it('throws QUEUE_ALREADY_STARTED if you try and start it again', () =>
      expect(worker.start()).to.be.rejectedWith(QUEUE_ALREADY_STARTED))
  })

  describe('stop', () => {
    context('before the worker was started', () => {
      before(() => {
        worker = makeWorker({ name, task })
      })

      it('throws NOT_CONNECTED', () =>
        expect(worker.stop()).to.be.rejectedWith(NOT_CONNECTED))
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

      it('closed the channel', () => {
        expect(channel.close).to.have.been.calledOnce
      })

      it('closed the connection', () => {
        expect(connection.close).to.have.been.calledOnce
      })
    })
  })
})
