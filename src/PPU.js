// Read memory at 0xFF40
// Will tell us which tile MAP to look at,
// Should render or not

const LCD_CONTROL_ADDRESS = 0xFF40;
const SCROLL_Y_ADDRESS = 0xFF42;
const SCROLL_X_ADDRESS = 0xFF43;

// which address is the window and tile map at?
// used by windowTileMapAddressSelect & bgTileMapAddressSelect
const WINDOW_BG_CODE_AREA_ADDRESS = [0x9800, 0x9C00];

// window and bg tile locations
// used by bgWinTileSet
const TILE_SET_ADDRESS = [0x8800, 0x8000];

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
  ] = read(LCD_CONTROL_ADDRESS).toString(2).padStart(8, 0).split('').map(Number);

  // console.log(lcdState);
  if (!lcdIsEnabled) { return lcdState; }
  const SC_Y = read(SCROLL_Y_ADDRESS);
  const SC_X = read(SCROLL_X_ADDRESS);

  console.log({
    lcdIsEnabled,
    windowTileMapAddressSelect,
    windowIsEnabled,
    bgWinTileSet,
    bgTileMapAddressSelect,
    objSize,
    objEnable,
    bgEnable,
  });
  console.log(__bigRead(0x8800, 32 * 32));
  // window render
  if (bgEnable) {
    // Which map to read from
    const mapAddress = WINDOW_BG_CODE_AREA_ADDRESS[windowTileMapAddressSelect];
    const tileSetAddress = TILE_SET_ADDRESS[bgWinTileSet];
    // console.log(tileSetAddress.toString(16));
    // console.log(TILE_SET_ADDRESS);
    // const g = __bigRead(tileSetAddress, 32 * 32).filter(Boolean);
    // console.log(g);
    const g2 = __bigRead(0x9800, 0x800).filter(Boolean);
    console.log(g2);
    // throw new Error();
    // 32 x 32 indexes for window/bg map
    for (let r = 0; r < 32; r++) {
      for (let c = 0; c < 32; c++) {
        // const curTile = read[mapAddress + r << 4 + c];
        // 16 bytes of dataq
        const tileNumber = read(mapAddress + (r * 32) + c);
        // console.log(tileNumber);


        const tileAddress = tileSetAddress + tileNumber * 16;
        // console.log(tileAddress);
        // if(tileAddress)
        const curTiles = __bigRead(tileAddress, 16);
        // console.log(tileAddress.toString(16), curTiles);
        // draw tile onto lcd
        for (let tR = 0; tR < 8; tR++) {
          if (curTiles.length === 0) break;
          const topRow = curTiles[tR * 2].toString(2).padStart(8, 0).split('').map(Number);
          const btmRow = curTiles[tR * 2 + 1].toString(2).padStart(8, 0).split('').map(Number);

          for (let tC = 0; tC < 8; tC++) {
            lcdState[r * 8 + tR][c * 8 + tC] = topRow[tC] * 2 + btmRow[tC];
            // console.log('a', topRow[tC] * 2 + btmRow[tC], tC);
          }
          // console.log('d', lcdState[r * 8 + tR][c * 8]);
        }
      }
    }
    // throw new Error();
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
