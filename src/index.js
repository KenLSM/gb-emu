const CONST = require('./constants');
const RomUtils = require('./romUtils');
const MemUtils = require('./memUtils');
const KeyUtils = require('./keypressUtils');
const { CB } = require('./CBOps');
const {
  State,
  u16,
  signed8,
  u16Tou8,
} = require('./state');

const { err, log } = require('./logger');

const ROM_FILE = './roms/DMG_ROM.bin';

const keyPressed = [null, true];
KeyUtils.handleKeyPress(keyPressed);

const memory = RomUtils.loadRom(ROM_FILE);

const BCDEHLA_TABLE = {
  0x04: 'B',
  0x0C: 'C',
  0x14: 'D',
  0x1C: 'E',
  0x24: 'H',
  0x2C: 'L',
  0x3C: 'A',
};

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

const systemState = new State();

const gameloop = state => {
  const {
    PC,
    setSP,
    addSP,
    addPC,
    setPC,
    xor,
  } = state;
  const opCode = memory[PC];
  log(`PC: 0x${PC.toString(16).padStart(4, 0)} OPCODE: ${opCode.toString(16)}`);
  switch (opCode) {
    case 0x08: // LD (nn), SP
      {
        const [H, L] = u16Tou8(state.SP);
        memory[state.PC + 2] = H;
        memory[state.PC + 1] = L;
        addPC(3);
      }
      break;

      // INC
    case 0x04: // B
    case 0x0C: // C
    case 0x14: // D
    case 0x1C: // E
    case 0x24: // H
    case 0x2C: // L
    case 0x3C: // A
      {
        const register = BCDEHLA_TABLE[opCode];
        // TODO: might have overflow/flags
        const v = state.getRegister(register) + 1;
        state.setRegister(register, v);
        addPC(1);
      }
      break;
      // DEC
    case 0x05: // B
    case 0x0D: // C
    case 0x15: // D
    case 0x1D: // E
    case 0x25: // H
    case 0x2D: // L
    case 0x3D: // A
      {
        const register = BCDEHLA_TABLE[opCode - 1];
        // TODO: might have overflow/flags
        const v = state.getRegister(register) - 1;
        state.setRegister(register, v);
        addPC(1);
      }
      break;

      // LD R, n
    case 0x06: // LD B, n
    case 0x0e: // LD C, n
    case 0x16: // LD D, n
    case 0x1e: // LD E, n
    case 0x26: // LD H, n
    case 0x2e: // LD L, n
    case 0x3e: // LD A, n
      {
        const n = memory[PC + 1];
        const register = BCDEHLA_TABLE[opCode - 2];
        state.setRegister(register, n);
        addPC(2);
      }
      break;
    case 0x36: // LD (HL), n
      {
        const n = memory[PC + 1];
        const HL = state.getRegister('HL');
        memory[HL] = n;
        addPC(2);
      }
      break;
    case 0x20: // JR NZ, r
    case 0xC2:
    case 0xCA:
    case 0x28:
    case 0x30:
    case 0xD2:
    case 0x38:
    case 0xDA:
      {
        const r = signed8(memory[PC + 1]);
        log('JR NZ, r');
        log('R', r.toString(16), PC.toString(16), memory[PC + 1].toString(16));
        if (state.readFByOpCode(opCode)) {
          log('JR NZ WILL JUMP');
          addPC(r);
        }
        addPC(2);
      }
      break;
    case 0x21: // LD HL, nn
      {
        log('PRE LD MEM', memory[PC + 2], memory[PC + 1]);
        const nn = u16(memory[PC + 2], memory[PC + 1]);
        state.setRegister('HL', nn);
        addPC(3);
      }
      break;
    case 0x22: // LD [HL+], A
    case 0x32: // LD [HL-], A
      {
        let HL = state.getRegister('HL');
        memory[HL] = state.A;
        HL += opCode === 0x22 ? 1 : -1;
        state.setRegister('HL', HL);
        log('LD [HL+-]', HL);
        addPC(1);
      }
      break;
    case 0x23: // INC HL
      {
        const HL = u16(state.H, state.L) + 1;
        state.setRegister('HL', HL);
        addPC(1);
      }
      break;
    case 0x31: // LD SP, nn
      setSP(u16(memory[PC + 2], memory[PC + 1]));
      addPC(3);
      break;
    case 0xAF:
      xor('A', state.A);
      log('XOR A with A');
      addPC(1);
      break;

    case 0xC7:
    case 0xD7:
    case 0xE7:
    case 0xF7:
    case 0xCF:
    case 0xDF:
    case 0xEF:
    case 0xFF:
      {
        const [H, L] = u16Tou8(PC);
        memory[state.SP - 1] = H;
        memory[state.SP - 2] = L;
        addSP(-2);
        setPC(RST_ADDRESS[opCode]);
      }
      break;

    case 0xE2: // LD (0xFF00 + C), A
      memory[0xFF00 + state.C] = state.A;
      addPC(1);
      break;
    case 0xCB: // Bit Operations
      CB(memory[PC + 1], state);
      log('CB', memory[PC + 1].toString(16));
      addPC(2);
      break;

    default:
      err('\n\nUnhandled OpCode:', opCode.toString(16));
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
let cycles = 0;
const FREQ = 4 * 1000 * 1000;
const M_SECOND = 1;
const SECOND = M_SECOND * 1000;

const M_FREQ = FREQ / SECOND;

let start = new Date().getTime();
const main = async () => {
  while (keyPressed[1]) {
    cycles += 1;

    // This is pause is required to allow keyboard event loop to have a chance of executing
    // However, this will add an additional 16ms of delay per pause
    if (cycles % M_FREQ === 0) {
      const now = new Date().getTime();
      // 8 MHZ
      delay = M_SECOND - (now - start);
      err('Delay value', delay);

      // setTimeout will cause the process to skip
      await new Promise(p => setTimeout(p, delay)); // eslint-disable-line
      start = now;
    }

    gameloop(systemState);
    // await stepper(systemState);
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
