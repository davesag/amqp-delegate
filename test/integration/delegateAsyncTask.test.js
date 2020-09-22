const { expect } = require('chai')
const makeWorker = require('../../src/makeWorker')
const makeDelegator = require('../../src/makeDelegator')

describe('delegate an asynchronous task', () => {
  const task = (a, b) => new Promise(resolve => setTimeout(() => resolve(a + b), 10))

  const worker = makeWorker({
    name: 'adder',
    task
  })

  const delegator = makeDelegator()

  let result

  before(async () => {
    await worker.start()
    await delegator.start()
    result = await delegator.invoke('adder', 10, 15)
  })

  after(async () => {
    await worker.stop()
    await delegator.stop()
  })

  it('returned the right result', () => {
    expect(result).to.equal(25)
  })
})
