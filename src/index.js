const MMU = require('./romUtils');
// const MemUtils = require('./memUtils');
const SaveLoadUtils = require('./slUtils');

const { cpuCycle } = require('./CPU');
const { ppuCycle, initLCD } = require('./PPU');
const LCD = require('./lcd').LCD();

const KeyUtils = require('./keypressUtils');

const {
  State,
} = require('./state');

const { err, log } = require('./logger');

const BOOTSTRAP_ROM = './roms/DMG_ROM.bin';
const GAME_ROM = './roms/pokemon_blue.gb';
// const GAME_ROM = './roms/Tetris.gb';

const keyPressed = [null, true];
KeyUtils.handleKeyPress(keyPressed);

const memory = new MMU(BOOTSTRAP_ROM, GAME_ROM);
// const memory = RomUtils.loadBootstrapRom(BOOTSTRAP_ROM);
// RomUtils.loadGameRom(memory, GAME_ROM);


const systemState = new State();
const lcdState = initLCD();

const stepper = async state => {
  while (!keyPressed[0] || ['u', 'i', 'o', 'p', 'f'].includes(keyPressed[0])) {
    switch (keyPressed[0]) {
      case 'u':
        console.log(JSON.stringify(memory.__bigRead(0x8000, 0x1000)), 'Entries in 0x8000-0x8FFF');
        break;
      case 'i':
        console.log(JSON.stringify(memory.__bigRead(0x8800, 0x1000)), 'Entries in 0x8800-0x97FF');
        break;
      case 'o':
        console.log(JSON.stringify(memory.__bigRead(0x9800, 0x400)), 'Entries in 0x9800-0x9BFF');
        break;
      case 'p':
        console.log(JSON.stringify(memory.__bigRead(0x9C00, 0x400)), 'Entries in 0x9C00-0x9FFF');
        break;
      case 'f':
        console.log(JSON.stringify(memory.__systemRam), JSON.stringify(memory.__systemRam.length), 'Full mem dump');
        break;
      default:
        break;
    }
    keyPressed[0] = null;
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
const FPS_60 = 1000;
let start = new Date().getTime();

const main = async () => {
  SaveLoadUtils.load('post_rom_clear.log', memory, systemState);
  while (keyPressed[1]) {
    cycles += 1;

    // This is pause is required to allow keyboard event loop to have a chance of executing
    // However, this will add an additional ~16ms of delay per pause
    if (cycles % M_FREQ === 0) {
      const now = new Date().getTime();
      // 8 MHZ
      delay = M_SECOND - (now - start);
      // err('Delay value', delay);

      // setTimeout will cause the process to skip
      await new Promise(p => setTimeout(p, delay)); // eslint-disable-line
      start = now;

      // await stepper(systemState);
    }
    if (cycles % FPS_60 === 0) {
      ppuCycle(lcdState, memory, () => stepper(systemState));
      await LCD.render(lcdState);
    }

    cpuCycle(systemState, memory);
    // LCD.render(lcdState);
    // Printing PC
    LCD.printPC('\033[1;31mPC:' + systemState.PC.toString() + '\033[0m');
    // console.log('\033[1;31m' + systemState.PC.toString() + '\033[0m');
    if (systemState.PC >= 0x0098) {
      // await stepper(systemState);
    }
  }
  log('\n\nHalted:', systemState.toString());
};

main()
  .catch(e => {
    err('### Crashed ##');
    err('\n\nSTATE DUMP:', systemState.toString());
    err(e.stack);
    // const fName = `${new Date().getTime()}.log`;
    // SaveLoadUtils.save(fName, memory, systemState);
  })
  .finally(() => {
    log('Ended');
    process.exit();
  });
