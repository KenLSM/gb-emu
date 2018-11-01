const CBArray = ['B', 'C', 'D', 'E', 'H', 'L', 'HL', 'A'];
const getRegister = op2 => CBArray[op2 % 8];
const getBitNum = opCode =>
  return false;

const readBit = (whichBit, register, state) => {
  return state.get;
};

const foo = (opCode, state) => {
  const bit1 = opCode & 0xF0;
  const bit2 = opCode & 0x0F;
  const bit1Upper = bit1 >> 2;

  const register = getRegister(bit2);
  switch (shiftedBit1) {
    case 0x0:
      throw new Error();
    case 0x1:
      return readBit(getBitNum(opCode), getRegister(register), state);
    case 0x2:
    case 0x3:
      break;
    default:
      throw new Error();
  }
};

module.exports = {
  foo,
};
