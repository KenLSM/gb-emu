const CONST = require('./constants');
const RomUtils = require('./romUtils');
const MemUtils = require('./memUtils');

const ROM_FILE = './roms/DMG_ROM.bin';

const memory = RomUtils.loadRom(ROM_FILE);

const gameloop = state => {
  const { PC } = state;
  const inst = memory[PC];
  switch (inst & 0XF000) {
    case 0x3:
      console.log('kajshd');
      break;
    default:
      console.log('lkajsdl;');
  }
};


gameloop();
