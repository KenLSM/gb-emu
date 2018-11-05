const fs = require('fs');
const { log } = require('./logger');

const parseRom = data => {
  const d = data.toString('hex');
  const ret = [];
  for (let i = 0; i < d.length; i += 2) {
    ret.push(parseInt(d.slice(i, i + 2), 16));
  }
  return ret;
};

const printRom = (rom, init = 0) => {
  for (let i = init; i < rom.length; i += 8) {
    const lineNum = String(i).padStart(4);
    log(lineNum,
      rom.slice(i, i + 2).join(''),
      rom.slice(i + 2, i + 4).join(''),
      rom.slice(i + 4, i + 6).join(''),
      rom.slice(i + 6, i + 8).join(''));
  }
};

const padRom = (romData, padding) => Array(padding).fill(0).concat(romData);


const loadRom = fileName => {
  const raw = fs.readFileSync(fs.openSync(fileName, 'r'));
  return parseRom(raw);
};

module.exports = {
  parseRom,
  printRom,
  padRom,
  loadRom,
};
