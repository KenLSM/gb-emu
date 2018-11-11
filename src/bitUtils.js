const u16Tou8 = b16 => [b16 >> 8, b16 & 0xFF];
const u16 = (b1, b2) => (b1 << 8) + b2;
const signed8 = b1 => b1 << 24 >> 24;
const didHalfCarry = (b1, b2) => Number((b1 & 0xF) + (b2 & 0xF) > 0xF);
const didCarry = (b1, b2) => Number((b1 & 0xF) + (b2 & 0xF) > 0xF);

module.exports = {
  u16Tou8,
  u16,
  signed8,
  didHalfCarry,
  didCarry,
};
