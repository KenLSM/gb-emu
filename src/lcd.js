const WINDOW = [160, 144];
const LCD = () => {
  const lcd = Array(WINDOW[0]);
  for (let i = 0; i < lcd.length; i++) {
    lcd[i] = Array(WINDOW[1]);
  }
};

const draw = lcd => {

};

module.exports = {
  LCD,
};
