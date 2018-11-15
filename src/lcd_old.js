// const WINDOW = [160, 144];
const WINDOW = [32 * 8, 32 * 8];
const LCD = () => {
  const lcd = Array(WINDOW[0]);
  for (let i = 0; i < lcd.length; i++) {
    lcd[i] = Array(WINDOW[1]);
  }
  return { lcd, SC_Y: 0, SC_X: 0 };
};

module.exports = {
  LCD,
};
