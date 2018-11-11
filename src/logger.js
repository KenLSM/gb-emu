const chalk = require('chalk');

const CONSTANTS = require('./constants');

const instLog = (...args) => (
  CONSTANTS.DEBUG ?
  console.log(chalk.green(args[0]), ...args.slice(1)) :
  null
);

const log = (...args) => (CONSTANTS.DEBUG ? console.log(...args) : null);
const err = (...args) => (console.error(chalk.red(...args)));

module.exports = {
  instLog,
  log,
  err,
};
