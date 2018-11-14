// Read memory at 0xFF40
// Will tell us which tile MAP to look at,
// Should render or not

const LCD_CONTROL_ADDRESS = 0xFF40;
const SCROLL_Y_ADDRESS = 0xFF42;
const SCROLL_X_ADDRESS = 0xFF43;
const WINDOW_BG_CODE_AREA_ADDRESS = [0x9800, 0x9C00];
const TILE_SET_ADDRESS = [0x8800, 0x8000];

// Map is 32x32
const ppuCycle = async (lcdState, { read, __bigRead }, stepper) => {
  const [
    lcdIsEnabled,
    windowTileMapAddress,
    windowIsEnabled,
    bgWinTileSet,
    bgTileMapAddress,
    objSize,
    objEnable,
    bgEnable,
  ] = read(LCD_CONTROL_ADDRESS).toString(2).padStart(8, 0).split('').map(Number);

  if (!lcdIsEnabled) { return lcdState; }
  const SC_Y = read(SCROLL_Y_ADDRESS);
  const SC_X = read(SCROLL_X_ADDRESS);

  if (windowIsEnabled) {
    const mapAddress = WINDOW_BG_CODE_AREA_ADDRESS[windowTileMapAddress];
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        const curTile = read[mapAddress + r * 32 + c];
        // draw tile onto lcd
        for (let tR = 0; tR < 8; tR++) {
          // const topBit = 
          // lcd=
        }
      }
    }
  }
  console.log({
    lcdIsEnabled,
    windowTileMapAddress,
    windowIsEnabled,
    bgWinTileSet,
    bgTileMapAddress,
    objSize,
    objEnable,
    bgEnable,
  });
  let g = __bigRead(0x9800, 32 * 32).filter(Boolean);
  console.log(g);
  g = __bigRead(0x9C00, 32 * 32).filter(Boolean);
  console.log(g);
  g = __bigRead(0x8000, 32 * 32).filter(Boolean);
  console.log(g);
  g = __bigRead(0x8800, 32 * 32).filter(Boolean);
  console.log(g);
  // console.log(g, __bigRead(0x9C00, 32 * 32));
  await stepper();

  // throw new Error();

  return lcdState;
};


module.exports = { ppuCycle };
