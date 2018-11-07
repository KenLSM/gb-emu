const { err } = require('./logger');

const BCDEHL_TABLE = ['B', 'C', 'D', 'E', 'H', 'L', 'HL', 'A'];
const CBArray = ['B', 'C', 'D', 'E', 'H', 'L', 'HL', 'A'];
const BitArray = [
  0x01, 0x02, 0x04, 0x08,
  0x10, 0x20, 0x40, 0x80,
];

const getRegister = uull => CBArray[uull & 0b111];
const getBitNum = opCode => {
  // 00 00 00 00 Complete Code 8 bits = 256 combi
  // 76 54 32 10 Bits Num
  // UU LL uu ll
  const UU = opCode >> 6;
  const LL = (opCode >> 4) % 4;
  const uu = (opCode >> 2) % 4;
  const ll = opCode % 4;
  const uull = opCode & 0x0F;
  return {
    UU,
    LL,
    uu,
    ll,
    uull,
  };
};

const didHalfCarry = (b1, b2) => Number((b1 & 0xF) + (b2 & 0xF) > 0xF);

const getOperatedBit = (LL, uu) => {
  const bit = (LL * 2) + (uu >> 1);
  // console.log('bit', bit, BitArray[bit].toString(2));
  return BitArray[bit];
};

const readBit = (whichBit, register, state) => {
  // console.log('readBit', state[register], whichBit);
  // if (whichBit === 0x80 && register === 'H') {
  //   const g = Number((state.getRegister(register) & whichBit) === whichBit);
  //   if (g !== 1) throw new Error();
  // }
  return Number((state.getRegister(register) & whichBit) === whichBit);
};


const resetBit = (whichBit, register, state) => {
  // state[register] &= ~whichBit;
  // return state[register];
  const v = state.getRegister(register) & ~whichBit;
  return state.setRegister(register, v);
};

const setBit = (whichBit, register, state) => {
  // state[register] |= whichBit;
  const v = state.getRegister(register) | whichBit;
  return state.setRegister(register, v);
};

// Main function
const CB = (opCode, state) => {
  const { UU, LL, uull, uu } = getBitNum(opCode);
  console.log('CB opCode', opCode.toString(16));
  // console.log('uull', uull.toString(2));
  switch (UU) {
    case 0x0: // UU == 0 - 3
      if ([0x11, 0x12, 0x13, 0x14, 0x15, 0x17].includes(opCode)) { // 0x16 is (HL)
        const r8 = BCDEHL_TABLE[opCode - 0x11];
        const C = Number((state[r8] & 0x80) === 0x80);
        state.setRegister(r8, (state.getRegister(r8) << 1) | state.readF('C'));
        console.log('r8', r8, !state.getRegister(r8));
        state.setFlag('Z', !state.getRegister(r8));
        state.setFlag('N', 0);
        state.setFlag('H', 0);
        state.setFlag('C', C);
        return state.getRegister(r8);
      }
      err('Unimplemented sub CB opCode', opCode.toString(16));
      throw new Error();
    case 0x1: // BIT-READ // UU == 4-7
      {
        const result = readBit(getOperatedBit(LL, uu), getRegister(uull), state);
        state.setFlag('Z', !result);
        state.setFlag('N', 0);
        state.setFlag('H', 1);
        return result;
      }
      break;


    case 0x2: // BIT-RESET // UU == 8-11

      // console.log('getOperatedBit', getOperatedBit(LL, uu));
      // console.log('uull', uull);
      // console.log('getRegister', getRegister(uull));
      // console.log(getOperatedBit(LL, uu));
      return resetBit(getOperatedBit(LL, uu), getRegister(uull), state);
    case 0x3: // BIT-SET // UU == 12-15
      // console.log('getOperatedBit', getOperatedBit(LL, uu));
      // console.log('uull', uull);
      // console.log('getRegister', getRegister(uull));
      return setBit(getOperatedBit(LL, uu), getRegister(uull), state);
    default:
      throw new Error();
  }
};

module.exports = {
  CBArray,
  CB,
  getBitNum,
  getOperatedBit,
  getRegister,
  readBit,
  didHalfCarry,
};
