const fs = require('fs');
const { log, err } = require('./logger');

const save = (fName, memory, state) => {
  log(`Saving memory and state to file ${fName}`);
  try {
    const fd = fs.openSync(fName, 'wx');
    const string = JSON.stringify({ memory: memory.save(), state });
    fs.writeSync(fd, string);
    fs.closeSync(fd);
    log('Save succeeded');
  } catch (e) {
    err('Saving error', e);
    throw e;
  }
};

const load = (fName, memory, state) => {
  log(`Loading memory and state from file ${fName}`);
  try {
    const fd = fs.openSync(fName, 'r');
    const raw = fs.readFileSync(fd);
    const data = JSON.parse(raw);
    memory.load(data.memory);
    ['B', 'C', 'D', 'E', 'H', 'L', 'A'].map(e => state.setRegister(e, data.state[e]));
    state.setPC(data.state.PC);
    state.setSP(data.state.SP);

    fs.closeSync(fd);
    log('Load succeeded');
  } catch (e) {
    err('Loading error', e);
    throw e;
  }
};

module.exports = {
  save,
  load,
};
