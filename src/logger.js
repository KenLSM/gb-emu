const CONSTANTS = require('./constants');

const log = (...args) => (CONSTANTS.DEBUG ? console.log(...args) : null);
const err = (...args) => (console.error(...args));

module.exports = {
  log,
  err,
};
