const { log, err } = require('./logger');
const u16Tou8 = b16 => [b16 >> 8, b16 & 0xFF];
const u16 = (b1, b2) => (b1 << 8) + b2;
const signed8 = b1 => b1 << 24 >> 24;


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
    this.readFByOpCode = this.readFByOpCode.bind(this);

    this.setSP = this.setSP.bind(this);
    this.addSP = this.addSP.bind(this);

    this.setPC = this.setPC.bind(this);
    this.addPC = this.addPC.bind(this);

    this.getRegister = this.getRegister.bind(this);
    this.setRegister = this.setRegister.bind(this);
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
        err('Unknown readF:', symbol);
        throw new Error();
    }
  }

  setFlag(symbol, val) {
    switch (symbol) {
      case 'Z':
        if (val) {
          this.F |= 0x80;
          break;
        }
        this.F &= 0x7F;
        break;
      case 'N':
        if (val) {
          this.F |= 0x40;
          break;
        }
        this.F &= 0xBF;
        break;
      case 'H':
        if (val) {
          this.F |= 0x20;
          break;
        }
        this.F &= 0xDF;
        break;
      case 'C':
        if (val) {
          this.F |= 0x10;
          break;
        }
        this.F &= 0xEF;
        break;
      default:
        err('Unknown setFlag:', symbol, val);
        throw new Error();
    }
  }

  readFByOpCode(opCode) {
    switch (opCode) {
      case 0x20:
      case 0xC2:
        return !this.readF('Z');
      case 0xCA:
      case 0x28:
        return this.readF('Z');
      case 0x30:
      case 0xD2:
        return !this.readF('C');
      case 0x38:
      case 0xDA:
        return this.readF('C');
      default:
        err('Unknown readFByOpCode:', opCode.toString(16));
        throw new Error();
    }
  }

  getRegister(r) {
    if (r === 'HL') {
      return u16(this.H, this.L);
    }
    return this[r];
  }

  setRegister(r, v) {
    if (r === 'HL') {
      const [H, L] = u16Tou8(v & 0xFFFF);
      this.H = H;
      this.L = L;
      return this.getRegister(r);
    }
    this[r] = v & 0xFF;
    return this.getRegister(r);
  }

  setSP(val) {
    this.SP = val;
    this.SP &= 0xFFFF;
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
    log('ADD PC:', val, 'CUR_PC:', this.PC.toString(16));
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

module.exports = {
  State,
  u16Tou8,
  u16,
  signed8,
};
