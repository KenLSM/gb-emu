const blessed = require('blessed');

const rand = max => Math.floor(Math.random() * max);
const cols = 160;
const rows = 144 / 2;

const widthStyle = () => Array(cols).fill(0).map(() => rand(4));
const lcd = Array(144).fill(cols).map(() => widthStyle());

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
const block2 = '▄';

const LCD = () => {
  const program = blessed.program();
  const row = lcd.length >> 1;
  const render = lcd => {
    // program.clear();
    for (let r = 0; r < row; r++) {
      const _r = r << 1;
      const top = lcd[_r];
      const btm = lcd[_r + 1];
      for (let c = 0; c < top.length; c += block2.length) {
        // program.move(c, r);
        if (c - 1 < 0 || top[c] !== top[c - 1]) {
          program.bg(ColorTable[top[c]]);
        }
        if (c - 1 < 0 || btm[c] !== btm[c - 1]) {
          program.fg(ColorTable[btm[c]]);
        }

        program.write(block2);
      }
      program.move(0, r);
    }
  };
  return { render: () => render(lcd) };
};

module.exports = {
  LCD,
};
