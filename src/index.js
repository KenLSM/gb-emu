const MMU = require('./romUtils');
// const MemUtils = require('./memUtils');
const SaveLoadUtils = require('./slUtils');

const { cpuCycle } = require('./CPU');
const { ppuCycle, initLCD } = require('./PPU');
const LCD = require('./b').LCD();

const KeyUtils = require('./keypressUtils');

const {
  State,
} = require('./state');

const { err, log } = require('./logger');

const BOOTSTRAP_ROM = './roms/DMG_ROM.bin';
const GAME_ROM = './roms/Tetris.gb';

const keyPressed = [null, true];
KeyUtils.handleKeyPress(keyPressed);

const memory = new MMU(BOOTSTRAP_ROM, GAME_ROM);
// const memory = RomUtils.loadBootstrapRom(BOOTSTRAP_ROM);
// RomUtils.loadGameRom(memory, GAME_ROM);


const systemState = new State();
const lcdState = initLCD();

const stepper = async state => {
  while (!keyPressed[0]) {
    await new Promise(p => setTimeout(p, 100)); // eslint-disable-line
  }
  keyPressed[0] = null;
  log('State', state.toString());
};

let delay = 1;
let cycles = 0;
const FREQ = 4 * 1000 * 1000;
const M_SECOND = 1;
const SECOND = M_SECOND * 1000;

const M_FREQ = FREQ / SECOND;

let start = new Date().getTime();

const main = async () => {
  // SaveLoadUtils.load('1542204200325.log', memory, systemState);
  while (keyPressed[1]) {
    cycles += 1;

    // This is pause is required to allow keyboard event loop to have a chance of executing
    // However, this will add an additional ~16ms of delay per pause
    if (cycles % M_FREQ === 0) {
      const now = new Date().getTime();
      // 8 MHZ
      delay = M_SECOND - (now - start);
      err('Delay value', delay);

      // setTimeout will cause the process to skip
      await new Promise(p => setTimeout(p, delay)); // eslint-disable-line
      start = now;
      // LCD.render(lcdState);
      // await stepper(systemState);
    }

    cpuCycle(systemState, memory);
    await ppuCycle(lcdState, memory, () => stepper(systemState));
    LCD.render(lcdState);
    // await stepper(systemState);
  }
  log('\n\nHalted:', systemState.toString());
};

main()
  .catch(e => {
    err('### Crashed ##');
    err('\n\nSTATE DUMP:', systemState.toString());
    err(e);
    const fName = `${new Date().getTime()}.log`;
    SaveLoadUtils.save(fName, memory, systemState);
  })
  .finally(() => {
    log('Ended');
    process.exit();
  });
