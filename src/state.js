const util = require('util');

const { log, err } = require('./logger');
const { u16, u16Tou8 } = require('./bitUtils');

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
        this.A &= 0xff;
        break;
      default:
        err('Unexpected symbol:', symbol);
        throw new Error();
    }
  }

  readF(symbol) {
    switch (symbol) {
      case 'Z':
        return (this.F & 0x80) === 0x80;
      case 'N':
        return (this.F & 0x40) === 0x40;
      case 'H':
        return (this.F & 0x20) === 0x20;
      case 'C':
        return (this.F & 0x10) === 0x10;
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
        this.F &= 0x7f;
        break;
      case 'N':
        if (val) {
          this.F |= 0x40;
          break;
        }
        this.F &= 0xbf;
        break;
      case 'H':
        if (val) {
          this.F |= 0x20;
          break;
        }
        this.F &= 0xdf;
        break;
      case 'C':
        if (val) {
          this.F |= 0x10;
          break;
        }
        this.F &= 0xef;
        break;
      default:
        err('Unknown setFlag:', symbol, val);
        throw new Error();
    }
  }

  readFByOpCode(opCode) {
    switch (opCode) {
      case 0x20:
      case 0xc2:
        return !this.readF('Z');
      case 0xca:
      case 0x28:
        return this.readF('Z');
      case 0x30:
      case 0xd2:
        return !this.readF('C');
      case 0x38:
      case 0xda:
        return this.readF('C');
      default:
        err('Unknown readFByOpCode:', opCode.toString(16));
        throw new Error();
    }
  }

  getRegister(r) {
    // if (['HL', 'BC', 'DE'].includes(r)) {
    switch (r) {
      case 'HL':
      case 'BC':
      case 'DE': {
        const left = r.charAt(0);
        const right = r.charAt(1);
        return u16(this[left], this[right]);
      }
      default:
        return this[r];
    }
    // const [left, right] = r.split('');
  }

  setRegister(r, v) {
    // if (['B', 'C', 'D', 'E', 'H', 'L', 'A', 'HL', 'BC', 'DE'].includes(r) === false) {
    //   err('Attemping to set non-existing register on state', r, v);
    //   throw new Error();
    // }
    switch (r) {
      case 'HL':
      case 'BC':
      case 'DE': {
        const left = r.charAt(0);
        const right = r.charAt(1);
        const [leftV, rightV] = u16Tou8(v & 0xffff);
        this[left] = leftV;
        this[right] = rightV;
        return this.getRegister(r);
      }
      default:
        this[r] = v & 0xff;
        return this.getRegister(r);
    }
    // if (['HL', 'BC', 'DE'].includes(r)) {
    // const [left, right] = r.split('');
    //   const left = r.charAt(0);
    //   const right = r.charAt(1);
    //   const [leftV, rightV] = u16Tou8(v & 0xffff);
    //   this[left] = leftV;
    //   this[right] = rightV;
    //   return this.getRegister(r);
    // }
  }

  setSP(val) {
    this.SP = val;
    this.SP &= 0xffff;
  }

  addSP(val) {
    this.SP += val;
    this.SP &= 0xffff;
  }

  setPC(val) {
    this.PC = val;
    this.PC &= 0xffff;
  }

  addPC(val) {
    this.PC += val;
    // log('ADD PC:', val, 'CUR_PC:', this.PC.toString(16));
    this.PC &= 0xffff;
  }

  toString() {
    const obj = Object.assign({}, this);
    for (const k in obj) {
      if (typeof obj[k] === 'function') {
        delete obj[k];
      }
    }
    return util.inspect(obj, { colors: true, depth: null, breakLength: Infinity });
  }
}

module.exports = {
  State,
};
