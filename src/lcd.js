const blessed = require('blessed');

// const rand = max => Math.floor(Math.random() * max);
const SCREEN_COLS = 160;
const SCREEN_ROWS = 144; // / 2;

// const lcd = Array(144).fill(cols).map(() => widthStyle());

const ColorTable = {
  0: 'black',
  1: 'gray',
  2: 'light gray',
  3: '#FFFFF0', // hack to get very white
};

// const OffColorTable = {
//   0: '!black',
//   1: '!gray',
//   2: '!light gray',
//   3: '!#FFFFF0', // hack to get very white
// };

const block = '▄';

const LCD = () => {
  const program = blessed.program();

  const render = ({ lcd: _lcd, SC_Y, SC_X }) => {
    // program.clear();
    // extract lcd part
    const gg = _lcd.reduce((accum, ll) => {
      const vv = ll.reduce((acc, l) => l + acc, 0);
      return accum + vv;
    }, 0);

    // console.log(gg);
    if (gg === 0) {
      console.log('No render');
      return;
      // throw new Error();
    }
    // console.log(_lcd.length);
    // console.log(_lcd.length[0]);
    // throw new Error();
    // console.log(JSON.stringify(_lcd));
    for (let r = 0; r < _lcd.length; r++) {
      // for (let c = 0; c < _lcd[r].length; c++) {
      // console.log(_lcd[r].join(''));
      // console.log(_lcd[r][c].join(''));
      // }
      // console.log();
    }
    // return;
    const lcd = [];
    for (let startR = SC_Y; startR < _lcd.length; startR++) {
      lcd[startR - SC_Y] = _lcd[startR].slice(SC_X, SC_X + SCREEN_COLS);
      // console.log(startR, lcd[startR] - SC_Y);
    }
    const row = lcd[0].length >> 1;

    for (let r = 0; r < row - 1; r++) {
      const _r = r << 1;
      const top = lcd[_r];
      const btm = lcd[_r + 1];
      for (let c = 0; c < top.length - 1; c += block.length) {
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

  const printPC = pc => {
    program.move(0, SCREEN_ROWS / 2);
    program.fg('red');
    program.write(pc);
    program.fg('!red');
  };
  return { render, printPC };
};

module.exports = {
  LCD,
};
