const morgan = require('morgan');

const logger = {
  morganDev: morgan('dev')
};

module.exports = logger;
