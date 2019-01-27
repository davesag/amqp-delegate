const { expect } = require('chai')
const makeWorker = require('../../src/makeWorker')
const makeDelegator = require('../../src/makeDelegator')

describe('delegate a task', () => {
  const task = async (a, b) => a + b

  const worker = makeWorker({
    name: 'adder',
    task
  })

  const delegator = makeDelegator({ exchange: 'test' })

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
