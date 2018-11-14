const fs = require('fs');
const { log, err } = require('./logger');

const VRAM_SIZE = 0x2000;
const ERAM_SIZE = 0x2000;
const RAM_SIZE = 0x2000;
const FULL_MMU_SIZE = 0xFFFF;

const parseRom = data => {
  const d = data.toString('hex');
  const ret = [];
  for (let i = 0; i < d.length; i += 2) {
    ret.push(parseInt(d.slice(i, i + 2), 16));
  }
  return ret;
};

const printRom = (rom, init = 0) => {
  for (let i = init; i < rom.length; i += 8) {
    const lineNum = String(i).padStart(4);
    log(lineNum,
      rom.slice(i, i + 2).join(''),
      rom.slice(i + 2, i + 4).join(''),
      rom.slice(i + 4, i + 6).join(''),
      rom.slice(i + 6, i + 8).join(''));
  }
};

const padRom = (romData, padding) => Array(padding).fill(0).concat(romData);

const loadRom = fileName => {
  console.log(fileName);
  const fd = fs.openSync(fileName, 'r');
  const raw = fs.readFileSync(fd);
  fs.closeSync(fd);
  return parseRom(raw);
};

class MMU {
  constructor(bootstrapRomDir, gameRomDir) {
    this.bootstrapRomDir = bootstrapRomDir;
    this.gameRomDir = gameRomDir;
    this.__bootstrapRom = loadRom(bootstrapRomDir);
    this.__gameRom = loadRom(gameRomDir);
    this.__systemRam = Array(0x8000).fill(0);

    this.read = this.read.bind(this);
    this.write = this.write.bind(this);

    this.__bigRead = this.__bigRead.bind(this);
    this.counter = 0;
  }

  load({ bootstrapRomDir, gameRomDir, systemRam }) {
    this.__bootstrapRom = loadRom(bootstrapRomDir);
    this.__gameRom = loadRom(gameRomDir);
    this.__systemRam = systemRam;
  }

  save() {
    return {
      bootstrapRomDir: this.bootstrapRomDir,
      gameRomDir: this.gameRomDir,
      systemRam: this.__systemRam,
    };
  }

  __bigRead(address, length) {
    if (address < 0x100) {
      return this.__bootstrapRom.slice(address, length);
    }

    if (address < 0x8000) {
      return this.__gameRom.slice(address, length);
    }

    if (address >= 0x8000) {
      return this.__systemRam.slice(address - 0x8000, length);
    }
  }


  read(address) {
    if (address === 0xFF4A) { throw new Error() };
    if (address > FULL_MMU_SIZE || address < 0) {
      err('READ OUT OF BOUND FOR MMU ROM', address.toString(16));
      throw new Error();
    }

    if (address < 0x100) {
      return this.__bootstrapRom[address];
    }

    if (address < 0x8000) {
      console.log(this.__gameRom[address].toString(16), address.toString(16));
      return this.__gameRom[address];
    }

    if (address >= 0x8000) {
      return this.__systemRam[address - 0x8000];
    }
  }

  write(address, data) {
    if (address < 0x100) {
      err('WRITING TO ROM ADDRESS NOT ALLOWED', address.toString(16), data);
      throw new Error();
    }
    if (address < 0x8000) {
      err('WRITING ONTO GAME ROM', address.toString(16), data);
      throw new Error();
    }
    if (address > 0xFFFF) {
      err('WRITE OUT OF BOUND FOR MMU ROM', address.toString(16));
      throw new Error();
    }

    if (address < 0xA000) {
      log('WRITING ONTO VIDEO RAM, DISPLAY NOT YET IMPLEMENTED', address.toString(16), data);
      // throw new Error();
    }

    // if (address > 0x992F && address < 0xA200) {
    //   throw new Error();
    // }
    console.log(address.toString(16), data);
    // this.counter++;
    this.__systemRam[address - 0x8000] = data;
    // if (this.counter > 10) { throw new Error(); }

  }
}
module.exports = MMU;
