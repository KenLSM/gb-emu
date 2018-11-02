const { expect } = require('chai');

const { State } = require('./state');
const Ops = require('./CBOps');

const state = new State();
state.setRegister('A', 0xFF);
state.setRegister('B', 0x00);
state.setRegister('C', 0xF0);
state.setRegister('D', 0b01000000);

expect(Ops.CB(0x78, state)).to.equal(0); // Read Bit 7 of B
expect(Ops.CB(0xF8, state)).to.equal(0b10000000); // Set Bit 7 of B;
expect(Ops.CB(0x78, state)).to.equal(1); // Read Bit 7 of B
expect(Ops.CB(0xB8, state)).to.equal(0x00); // Reset Bit 7 of B
expect(Ops.CB(0x78, state)).to.equal(0); // Read Bit 7 of B


expect(Ops.CB(0x72, state)).to.equal(1); // Read Bit 6 of D


expect(Ops.CB(0x87, state)).to.equal(0xFE); // Reset Bit 0 of A
expect(Ops.CB(0xC7, state)).to.equal(0xFF); // Set Bit 0 of A
expect(Ops.CB(0x47, state)).to.equal(1); // Read Bit 0 of A

state.setRegister('H', 0x9F);
state.setRegister('H', 0xFE);
expect(Ops.CB(0x7c, state)).to.equal(1);
state.setRegister('H', 0x7F);
expect(Ops.CB(0x7c, state)).to.equal(0);
console.log('Tests OK');
