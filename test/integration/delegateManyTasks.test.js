const { expect } = require('chai')
const makeWorker = require('../../src/makeWorker')
const makeDelegator = require('../../src/makeDelegator')

// TODO: sometimes this gets stuck.  work out why.
describe('delegate many tasks to multiple workers', () => {
  const task = (a, b) =>
    new Promise(resolve => setTimeout(() => resolve(a + b), 5))

  const worker1 = makeWorker({
    name: 'adder',
    task
  })

  const worker2 = makeWorker({
    name: 'adder',
    task
  })

  const delegator = makeDelegator()

  let results

  before(async () => {
    await Promise.all([worker1.start(), worker2.start(), delegator.start()])
    results = await Promise.all([
      delegator.invoke('adder', 10, 15),
      delegator.invoke('adder', 20, 30),
      delegator.invoke('adder', 40, 50),
      delegator.invoke('adder', 100, 200)
    ])
  })

  after(async () => {
    await Promise.all([worker1.stop(), worker2.stop()])
    await delegator.stop()
  })

  it('returned the right results', () => {
    expect(results).to.deep.equal([25, 50, 90, 300])
  })
})
