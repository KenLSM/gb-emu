// Read memory at 0xFF40
// Will tell us which tile MAP to look at,
// Should render or not

const LCD_CONTROL_ADDRESS = 0xFF40;
const SCROLL_Y_ADDRESS = 0xFF42;
const SCROLL_X_ADDRESS = 0xFF43;
const WINDOW_TILE_MAP_ADDRESS = [0x9800, 0x9C00];
const TILE_SET_ADDRESS = [0x8000, 0x8800];

// Map is 32x32
const ppuCycle = (lcdState, { read }) => {
  const [
    lcdEnabled,
    windowTileMapAddress,
    windowEnable,
    bgWinTileData,
    bgTileMapAddress,
    objSize,
    objEnable,
    bgEnable,
  ] = read(LCD_CONTROL_ADDRESS).toString(2).padStart(8, 0).split('').map(Number);

  if (!lcdEnabled) { return lcdState; }
  const SC_Y = read(SCROLL_Y_ADDRESS);
  const SC_X = read(SCROLL_X_ADDRESS);

  if (windowEnable) {
    const mapAddress = WINDOW_TILE_MAP_ADDRESS[windowTileMapAddress];
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
  console.log([
    lcdEnabled,
    windowTileMapAddress,
    windowEnable,
    bgWinTileData,
    bgTileMapAddress,
    objSize,
    objEnable,
    bgEnable,
  ]);
  throw new Error();

  return lcdState;
};


module.exports = { ppuCycle };
