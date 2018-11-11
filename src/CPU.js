const { err, instLog, log } = require('./logger');
const { CB } = require('./CBOps');

const {
  u16,
  signed8,
  u16Tou8,
  didHalfCarry,
} = require('./bitUtils');

const BDH_TABLE = {
  4: 'B',
  5: 'D',
  6: 'H',
};

const CELA_TABLE = {
  4: 'C',
  5: 'E',
  6: 'L',
  7: 'A',
};

const BC_DE_HL_TABLE = {
  0: 'BC',
  1: 'DE',
  2: 'HL',
  3: 'AF',
};

const BCDEHLA_TABLE = {
  0x04: 'B',
  0x0C: 'C',
  0x14: 'D',
  0x1C: 'E',
  0x24: 'H',
  0x2C: 'L',
  0x3C: 'A',
};

const BCDEHLA_TABLE_NUM = {
  0: 'B',
  1: 'C',
  2: 'D',
  3: 'E',
  4: 'H',
  5: 'L',
  // 6: (HL) is memory access
  7: 'A',
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

const cpuCycle = (state, { read, write }) => {
  const {
    PC,
    setSP,
    addSP,
    addPC,
    setPC,
    xor,
  } = state;
  const opCode = read(PC);
  instLog(`PC: 0x${PC.toString(16).padStart(4, 0)} OPCODE: ${opCode.toString(16)}`);
  if (PC === 0x68) {
    log(read(0xFF44));
    write(0xFF44, 0x90); // Faking VBlank, should not do this
  }
  if (PC === 0xE0) {
    // throw new Error();
  }
  switch (opCode) {
    // Stack Push/pop
    case 0xC5: // PUSH BC
    case 0xD5: // PUSH DE
    case 0xE5: // PUSH HL
    case 0xF5: // PUSH AF
      {
        const r16 = BC_DE_HL_TABLE[(opCode >> 4) - 0xC];
        const [H, L] = u16Tou8(state.getRegister(r16));
        write(state.SP - 0, H);
        write(state.SP - 1, L);
        addSP(-2);
        addPC(1);
      }
      break;

    case 0xC1: // POP BC
    case 0xD1: // POP DE
    case 0xE1: // POP HL
    case 0xF1: // POP AF
      {
        const r16 = BC_DE_HL_TABLE[(opCode >> 4) - 0xC];
        addSP(2);
        const H = read(state.SP - 0);
        const L = read(state.SP - 0);
        const HL = u16(H, L);
        const HL2 = u16(H, L);
        instLog('POP', HL, HL2);
        state.setRegister(r16, HL);
        addPC(1);
      }
      break;


    case 0x08: // LD (nn), SP
      {
        const [H, L] = u16Tou8(state.SP);
        write(state.PC + 2, H);
        write(state.PC + 1, L);
        addPC(3);
      }
      break;

      // INC r8
    case 0x04: // B
    case 0x0C: // C
    case 0x14: // D
    case 0x1C: // E
    case 0x24: // H
    case 0x2C: // L
    case 0x3C: // A
      {
        const r8 = BCDEHLA_TABLE[opCode];
        const v = state.getRegister(r8) + 1;

        state.setFlag('Z', !v);
        state.setFlag('N', 0);
        state.setFlag('H', didHalfCarry(v, state.getRegister(r8)));
        state.setRegister(r8, v);

        addPC(1);
      }
      break;
      // DEC r8
    case 0x05: // B
    case 0x0D: // C
    case 0x15: // D
    case 0x1D: // E
    case 0x25: // H
    case 0x2D: // L
    case 0x3D: // A
      {
        const r8 = BCDEHLA_TABLE[opCode - 1];
        const v = state.getRegister(r8) - 1;

        state.setFlag('Z', !v);
        state.setFlag('N', 1);
        state.setFlag('H', didHalfCarry(v, state.getRegister(r8)));
        state.setRegister(r8, v);

        addPC(1);
      }
      break;

      // INC r18
    case 0x03: // BC
    case 0x13: // DE
    case 0x23: // HL
      {
        const r16 = BC_DE_HL_TABLE[opCode >> 4]; // check UU
        const v = state.getRegister(r16) + 1;
        state.setRegister(r16, v);

        addPC(1);
      }
      break;

      // DEC r18
    case 0x0B: // BC
    case 0x1B: // DE
    case 0x2B: // HL
      {
        const r16 = BC_DE_HL_TABLE[opCode >> 4]; // check UU
        const v = r16 - 1;
        state.setRegister(r16, v);

        addPC(1);
      }
      break;
      // LD R, n
    case 0x06: // LD B, n
    case 0x0E: // LD C, n
    case 0x16: // LD D, n
    case 0x1E: // LD E, n
    case 0x26: // LD H, n
    case 0x2E: // LD L, n
    case 0x3E: // LD A, n
      {
        const n = read(PC + 1);
        const r8 = BCDEHLA_TABLE[opCode - 2];
        state.setRegister(r8, n);
        addPC(2);
      }
      break;
    case 0x36: // LD (HL), n
      {
        const n = read(PC + 1);
        const HL = state.getRegister('HL');
        write(HL, n);
        addPC(2);
      }
      break;

      // LD R16, nn
    case 0x01: // LD BC, nn
    case 0x11: // LD DE, nn
    case 0x21: // LD HL, nn
      {
        const r16 = BC_DE_HL_TABLE[opCode >> 4]; // check UU
        const nn = u16(read(PC + 2), read(PC + 1));
        state.setRegister(r16, nn);
        addPC(3);
      }
      break;

    case 0x31: // LD SP, nn
      setSP(u16(read(PC + 2), read(PC + 1)));
      addPC(3);
      break;

    case 0x1A: // LD A, (BC)
    case 0x2A: // LD A, (DE)
      {
        const r16 = BC_DE_HL_TABLE[opCode >> 4]; // check UU
        state.setRegister('A', read(state.getRegister(r16)));
        addPC(1);
      }
      break;

    case 0x18: // JR r
      {
        const r = signed8(read(PC + 1));
        instLog('JR r');
        addPC(r);
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
        const r = signed8(read(PC + 1));
        instLog('JR NZ, r');
        instLog('R', r.toString(16), PC.toString(16), read(PC + 1).toString(16));
        if (state.readFByOpCode(opCode)) {
          instLog('JR NZ WILL JUMP');
          addPC(r);
        }
        addPC(2);
      }
      break;

    case 0x22: // LD [HL+], A
    case 0x32: // LD [HL-], A
      {
        let HL = state.getRegister('HL');
        write(HL, state.A);
        HL += opCode === 0x22 ? 1 : -1;
        state.setRegister('HL', HL);
        instLog('LD [HL+-]', HL);
        addPC(1);
      }
      break;

    case 0x77: // LD (HL), A
      {
        const HL = state.getRegister('HL');
        write(HL, state.A);
      }
      addPC(1);
      break;

    case 0xEA: // LD (nn), A
      {
        const nn = u16(read(PC + 2), read(PC + 1));
        write(nn, state.getRegister('A'));
        addPC(3);
      }
      break;

    case 0xAF: // XOR A
      xor('A', state.A);
      instLog('XOR A with A');
      addPC(1);
      break;

    case 0xC7: // RST
    case 0xD7:
    case 0xE7:
    case 0xF7:
    case 0xCF:
    case 0xDF:
    case 0xEF:
    case 0xFF:
      {
        const [H, L] = u16Tou8(PC);
        write(state.SP - 0, H);
        write(state.SP - 1, L);
        addSP(-2);
        setPC(RST_ADDRESS[opCode]);
      }
      break;
      // LD r8(BDH), B
    case 0x40: // LD B, B
    case 0x50: // LD D, B
    case 0x60: // LD H, B
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.B);
        addPC(1);
      }
      break;
      // LD r8(BDH), C
    case 0x41: // LD B, C
    case 0x51: // LD D, C
    case 0x61: // LD H, C
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.C);
        addPC(1);
      }
      break;
      // LD r8(BDH), D
    case 0x42: // LD B, D
    case 0x52: // LD D, D
    case 0x62: // LD H, D
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.D);
        addPC(1);
      }
      break;
      // LD r8(BDH), E
    case 0x43: // LD B, E
    case 0x53: // LD D, E
    case 0x63: // LD H, E
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.E);
        addPC(1);
      }
      break;
      // LD r8(BDH), H
    case 0x44: // LD B, H
    case 0x54: // LD D, H
    case 0x64: // LD H, H
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.H);
        addPC(1);
      }
      break;
      // LD r8(BDH), L
    case 0x45: // LD B, L
    case 0x55: // LD D, L
    case 0x65: // LD H, L
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.L);
        addPC(1);
      }
      break;
      // LD r8(BDH), A
    case 0x47: // LD B, A
    case 0x57: // LD D, A
    case 0x67: // LD H, A
      {
        const r8 = BDH_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.A);
        addPC(1);
      }
      break;

      // LD r8(CELA), E
    case 0x4B: // LD C, E
    case 0x5B: // LD E, E
    case 0x6B: // LD L, E
    case 0x7B: // LD A, E
      {
        const dstR8 = CELA_TABLE[opCode >> 4]; // check UU
        const srcR8 = 'E';
        state.setRegister(dstR8, state.getRegister(srcR8));
        addPC(1);
      }
      break;
      // LD r8(CELA), H
    case 0x4C: // LD C, H
    case 0x5C: // LD E, H
    case 0x6C: // LD L, H
    case 0x7C: // LD A, H
      {
        const dstR8 = CELA_TABLE[opCode >> 4]; // check UU
        const srcR8 = 'H';
        state.setRegister(dstR8, state.getRegister(srcR8));
        addPC(1);
      }
      break;
      // LD r8(CELA), L
    case 0x4D: // LD C, L
    case 0x5D: // LD E, L
    case 0x6D: // LD L, L
    case 0x7D: // LD A, L
      {
        const dstR8 = CELA_TABLE[opCode >> 4]; // check UU
        const srcR8 = 'L';
        state.setRegister(dstR8, state.getRegister(srcR8));
        addPC(1);
      }
      break;

      // LD r8(CELA), A
    case 0x4F: // LD C, A
    case 0x5F: // LD E, A
    case 0x6F: // LD L, A
    case 0x7F: // LD A, A
      {
        const r8 = CELA_TABLE[opCode >> 4]; // check UU
        state.setRegister(r8, state.A);
        addPC(1);
      }
      break;

      // Special LD
    case 0xE0: // LDH (n), A i.e, // LD (0xFF00 + n), A
      {
        const n = read(PC + 1);
        write(0xFF00 + n, state.A);
        addPC(2);
      }
      break;
    case 0xF0: // LDH A,(n) i.e, // LD A, (0xFF00 + n)
      {
        const n = read(PC + 1);
        state.A = read(0xFF00 + n);
        addPC(2);
      }
      break;
    case 0xE2: // LD (0xFF00 + C), A
      write(0xFF00 + state.C, state.A);
      addPC(1);
      break;
    case 0xF2: // LD  A, (0xFF00 + C)
      state.A = read(0xFF00 + state.C);
      addPC(1);
      break;


    case 0xCB: // Bit Operations
      CB(read(PC + 1), state);
      addPC(2);
      break;

    case 0x17: // RLA
      {
        const C = Number((state.A & 0x80) === 0x80);
        state.setRegister('A', (state.A << 1) | state.readF('C'));
        state.setFlag('Z', 0);
        state.setFlag('N', 0);
        state.setFlag('H', 0);
        state.setFlag('C', C);

        addPC(1);
      }
      break;

    case 0xCD: // Call nn
      {
        const nn = u16(read(PC + 2), read(PC + 1));
        addPC(3);
        const [H, L] = u16Tou8(state.PC);
        write(state.SP - 0, H);
        write(state.SP - 1, L);
        addSP(-2);
        setPC(nn);
      }
      break;

    case 0xC9: // RTN
      {
        addSP(2);
        const H = read(state.SP - 0);
        const L = read(state.SP - 1);
        const HL = u16(H, L);
        setPC(HL);
      }
      break;

    case 0xFE: // CP n
      {
        const n = read(PC + 1);
        const A = state.getRegister('A');
        const sub = A - n;
        const C = sub < 0; // If n is larger than A, then it will have to borrow the bits from MSB
        instLog('CP n', n.toString(16));
        state.setFlag('Z', !sub);
        state.setFlag('N', 1);
        state.setFlag('H', didHalfCarry(n, A));
        state.setFlag('C', C);

        addPC(2);
      }
      break;
    case 0xBE: // CP (HL)
      {
        const HL = state.getRegister('HL');
        const n = read(HL);
        const A = state.getRegister('A');
        const sub = A - n;
        const C = sub < 0; // If n is larger than A, then it will have to borrow the bits from MSB
        instLog('CP n', n.toString(16));
        state.setFlag('Z', !sub);
        state.setFlag('N', 1);
        state.setFlag('H', didHalfCarry(n, A));
        state.setFlag('C', C);

        addPC(1);
      }
      break;

      // SUB BCDEHL
    case 0x90: // B
    case 0x91: // C
    case 0x92: // D
    case 0x93: // E
    case 0x94: // H
    case 0x95: // L
    case 0x97: // A
      {
        const r8 = state.getRegister(BCDEHLA_TABLE_NUM[opCode - 0x90]);
        const sub = state.getRegister('A') - r8;
        const A = state.getRegister('A');
        const C = sub < 0;
        state.setRegister('A', sub);

        state.setFlag('Z', !sub);
        state.setFlag('N', 1);
        state.setFlag('H', didHalfCarry(r8, A));
        state.setFlag('C', C);

        log('FLAG', !sub, 1, didHalfCarry(r8, A), C);
        log('r8, A', r8, A);
        log('F', state.getRegister('F').toString(2));
        addPC(1);
        // throw new Error();
      }
      break;

    default:
      err('\n\nUnhandled OpCode:', opCode.toString(16));
      throw new Error();
  }
};


module.exports = {
  cpuCycle,
};
