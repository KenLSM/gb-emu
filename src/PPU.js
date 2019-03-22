// Read memory at 0xFF40
// Will tell us which tile MAP to look at,
// Should render or not
const { instLog } = require('./logger');

const LCD_CONTROL_ADDRESS = 0xff40;
const SCROLL_Y_ADDRESS = 0xff42;
const SCROLL_X_ADDRESS = 0xff43;

// which address is the window and tile map at?
// used by windowTileMapAddressSelect & bgTileMapAddressSelect
const WINDOW_BG_CODE_AREA_ADDRESS = [0x9800, 0x9c00];

// window and bg tile locations
// used by bgWinTileSet
const TILE_SET_ADDRESS = [0x8800, 0x8000];
const topRow = [];
const btmRow = [];
topRow.length = 8;
btmRow.length = 8;

// Map is 32x32
const ppuCycle = async ({ lcd: lcdState }, { read, __bigRead }, stepper) => {
  const [
    lcdIsEnabled,
    windowTileMapAddressSelect,
    windowIsEnabled,
    bgWinTileSet,
    bgTileMapAddressSelect,
    objSize,
    objEnable,
    bgEnable,
  ] = read(LCD_CONTROL_ADDRESS)
    .toString(2)
    .padStart(8, 0)
    .split('')
    .map(Number);

  // console.log(lcdState);
  if (!lcdIsEnabled) {
    return lcdState;
  }

  const SC_Y = read(SCROLL_Y_ADDRESS);
  const SC_X = read(SCROLL_X_ADDRESS);

  instLog('PPU', 'Flags', {
    lcdIsEnabled,
    windowTileMapAddressSelect,
    windowIsEnabled,
    bgWinTileSet,
    bgTileMapAddressSelect,
    objSize,
    objEnable,
    bgEnable,
  });

  // window render
  if (bgEnable) {
    // Which map to read from
    const mapAddress = WINDOW_BG_CODE_AREA_ADDRESS[windowTileMapAddressSelect];
    const tileSetAddress = TILE_SET_ADDRESS[bgWinTileSet];

    // 32 x 32 indexes for window/bg map
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        // 16 bytes of dataq
        const tileNumber = read(mapAddress + r * 32 + c);
        const tileAddress = tileSetAddress + tileNumber * 16;
        const curTiles = __bigRead(tileAddress, 16);

        // draw tile onto lcd
        for (let tR = 0; tR < 8; tR++) {
          if (curTiles.length === 0) break;

          const tmpCurTiles = curTiles[tR * 2];

          topRow[7 | 0] = tmpCurTiles & 0b1;
          topRow[6 | 0] = (tmpCurTiles & 0b10) >> 1;
          topRow[5 | 0] = (tmpCurTiles & 0b100) >> 2;
          topRow[4 | 0] = (tmpCurTiles & 0b1000) >> 3;
          topRow[3 | 0] = (tmpCurTiles & 0b10000) >> 4;
          topRow[2 | 0] = (tmpCurTiles & 0b100000) >> 5;
          topRow[1 | 0] = (tmpCurTiles & 0b1000000) >> 6;
          topRow[0 | 0] = (tmpCurTiles & 0b10000000) >> 7;

          const tmpCurTilesB = curTiles[tR * 2 + 1];

          btmRow[7 | 0] = tmpCurTilesB & 0b1;
          btmRow[6 | 0] = (tmpCurTilesB & 0b10) >> 1;
          btmRow[5 | 0] = (tmpCurTilesB & 0b100) >> 2;
          btmRow[4 | 0] = (tmpCurTilesB & 0b1000) >> 3;
          btmRow[3 | 0] = (tmpCurTilesB & 0b10000) >> 4;
          btmRow[2 | 0] = (tmpCurTilesB & 0b100000) >> 5;
          btmRow[1 | 0] = (tmpCurTilesB & 0b1000000) >> 6;
          btmRow[0 | 0] = (tmpCurTilesB & 0b10000000) >> 7;

          for (let tC = 0; tC < 8; tC++) {
            const val = topRow[tC] * 2 + btmRow[tC];
            lcdState[r * 8 + tR][c * 8 + tC] = val;
          }
        }
      }
    }
  }
  return { lcd: lcdState, SC_Y, SC_X };
};

const WINDOW = [32 * 8, 32 * 8];
const initLCD = () => {
  const lcd = Array(WINDOW[0]);
  for (let i = 0; i < lcd.length; i++) {
    lcd[i] = Array(WINDOW[1]).fill(0);
  }
  return { lcd, SC_Y: 0, SC_X: 0 };
};

module.exports = { ppuCycle, initLCD };
