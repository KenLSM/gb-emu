const CONST = require('./constants');
const RomUtils = require('./romUtils');
const MemUtils = require('./memUtils');
const KeyUtils = require('./keypressUtils');

const { err, log } = require('./logger');

const ROM_FILE = './roms/DMG_ROM.bin';

const keyPressed = [null, true];
KeyUtils.handleKeyPress(keyPressed);

const memory = RomUtils.loadRom(ROM_FILE);

const RST_ADDRESS = {
  0xC7: 0x00,
  0xD7: 0x10,
  0xE7: 0x20,
  0xF7: 0x30,
  0xCF: 0x08,
  0xDF: 0x18,
  0xEF: 0x28,
  0xFF: 0x38,
};

class State {
  constructor() {
    this.PC = 0; // Program Counter: 16 bit
    this.SP = 0; // Stack Pointer: 16 bit

    // flags
    this.A = 0; // 8 bit
    this.B = 0; // 8 bit
    this.C = 0; // 8 bit
    this.D = 0; // 8 bit
    this.E = 0; // 8 bit
    this.F = 0; // F CPU flags,
    this.H = 0; // 8 bit
    this.L = 0; // 8 bit

    this.xor = this.xor.bind(this);

    this.readF = this.readF.bind(this);
    this.setSP = this.setSP.bind(this);
    this.addSP = this.addSP.bind(this);

    this.setPC = this.setPC.bind(this);
    this.addPC = this.addPC.bind(this);
  }

  xor(symbol, source) {
    switch (symbol) {
      case 'A':
        this.A ^= source;
        this.A &= 0xFF;
        break;
      default:
        err('Unexpected symbol:', symbol);
        throw new Error();
    }
  }

  readF(symbol) {
    switch (symbol) {
      case 'Z':
        return this.F & 0x80;
      case 'N':
        return this.F & 0x40;
      case 'H':
        return this.F & 0x20;
      case 'C':
        return this.F & 0x10;
      default:
        return 0;
    }
  }

  setSP(val) {
    console.log(val, this.SP);
    this.SP = val;
    this.SP &= 0xFFFF;
    console.log(val, this.SP);
  }

  addSP(val) {
    this.SP += val;
    this.SP &= 0xFFFF;
  }

  setPC(val) {
    this.PC = val;
    this.PC &= 0xFFFF;
  }

  addPC(val) {
    this.PC += val;
    log(this.PC);
    this.PC &= 0xFFFF;
  }

  toString() {
    const obj = Object.assign({}, this);
    for (const k in obj) {
      if (typeof obj[k] === 'function') {
        delete obj[k];
      }
    }
    return obj;
  }
}

const systemState = new State();

const unsigned16 = (b1, b2) => (b1 << 8) + b2;

const gameloop = state => {
  const {
    PC,
    setSP,
    addSP,
    addPC,
    setPC,
    xor,
  } = state;
  const inst = memory[PC];
  log('INST:', inst.toString(16));
  switch (inst) {
    case 0x05: // DEC B
      state.B = (state.B - 1) && 0xFF;
      addPC(1);
      break;
    case 0x08: // L D(nn), SP
      memory[state.PC + 2] = state.SP & 0xFF00;
      memory[state.PC + 1] = state.SP & 0x00FF;
      addPC(3);
      break;
    case 0x22: // LD [HL+], A
      {
        const HL = unsigned16(state.H, state.L);
        memory[HL] = state.A;
        state.H = (HL + 1) & 0xFF00;
        state.L = (HL + 1) & 0x00FF;
        addPC(1);
      }
      break;
    case 0x31:
      setSP(unsigned16(memory[PC + 1], memory[PC + 2]));
      addPC(3);
      break;
    case 0xAF:
      xor('A', memory[PC + 1]);
      addPC(2);
      break;

    case 0xC7:
    case 0xD7:
    case 0xE7:
    case 0xF7:
    case 0xCF:
    case 0xDF:
    case 0xEF:
    case 0xFF:
      memory[state.SP - 1] = PC & 0xFF00;
      memory[state.SP - 2] = PC & 0x00FF;
      addSP(-2);
      setPC(RST_ADDRESS[inst]);
      break;
    default:
      err('\n\nUnhandled instruction:', inst.toString(16));
      throw new Error();
  }
};

const stepper = async state => {
  while (!keyPressed[0]) {
    await new Promise(p => setTimeout(p, 100)); // eslint-disable-line
  }
  keyPressed[0] = null;
  log('State', state.toString());
};

let delay = 1;

const main = async () => {
  while (keyPressed[1]) {
    const start = new Date().getTime();
    await new Promise(p => setTimeout(p, delay)); // eslint-disable-line
    await gameloop(systemState);
    // await stepper(systemState);
    // log((new Date().getTime() - start));
    delay = 16 - (new Date().getTime() - start); // 60 fps
  }
  log('\n\nHalted:', systemState.toString());
};

main()
  .catch(e => {
    err('### Crashed ##');
    err('\n\nSTATE DUMP:', systemState.toString());
    err(e);
  })
  .finally(() => {
    console.log('Ended');
    process.exit();
  });
