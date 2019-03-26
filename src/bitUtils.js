const u16Tou8 = b16 => [b16 >> 8, b16 & 0xff];
const u16 = (b1, b2) => (b1 << 8) + b2;
const signed8 = b1 => (b1 << 24) >> 24;
const didHalfCarry = (b1, b2) => ((b1 & 0xf) + (b2 & 0xf) > 0xf) | 0;
const didCarry = (b1, b2) => ((b1 & 0xf) + (b2 & 0xf) > 0xf) | 0;

module.exports = {
  u16Tou8,
  u16,
  signed8,
  didHalfCarry,
  didCarry,
};
