const blessed = require('blessed');

const rand = max => Math.floor(Math.random() * max);
const cols = 160;
const rows = 144 / 2;

const widthStyle = () => Array(cols).fill(0).map(() => rand(4));
// const lcd = Array(144).fill(cols).map(() => widthStyle());

const ColorTable = {
  0: 'black',
  1: 'gray',
  2: 'light gray',
  3: '#FFFFF0', // hack to get very white
};
const OffColorTable = {
  0: '!black',
  1: '!gray',
  2: '!light gray',
  3: '!#FFFFF0', // hack to get very white
};

const block = '▄';

const LCD = () => {
  const program = blessed.program();

  const render = ({ lcd: _lcd, SC_Y, SC_X }) => {
    // program.clear();
    // extract lcd part
    const gg = _lcd.reduce((accum, ll) => {
      const vv = ll.reduce((acc, l) => {
        return l + acc;
      }, 0);
      return accum + vv;
    }, 0);

    console.log(gg);
    if (gg != 0) { throw new Error(); }
    // console.log(JSON.stringify(_lcd));
    return;
    const lcd = [];
    for (let startR = SC_Y; startR < _lcd.length; startR++) {
      lcd[startR - SC_Y] = _lcd[startR].slice(SC_X, cols);
      console.log(startR, lcd[startR] - SC_Y);
    }
    const row = lcd.length >> 1;

    for (let r = 0; r < row; r++) {
      const _r = r << 1;
      const top = lcd[_r];
      const btm = lcd[_r + 1];
      for (let c = 0; c < top.length; c += block.length) {
        // program.move(c, r);
        if (c - 1 < 0 || top[c] !== top[c - 1]) {
          program.bg(ColorTable[top[c]]);
        }
        if (c - 1 < 0 || btm[c] !== btm[c - 1]) {
          program.fg(ColorTable[btm[c]]);
        }

        program.write(block);
      }
      program.move(0, r);
    }
  };
  return { render };
};

module.exports = {
  LCD,
};
