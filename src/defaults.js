const defaults = {
  url: process.env.AMQP_URL || 'amqp://localhost',
  exchange: ''
}

module.export = defaults
