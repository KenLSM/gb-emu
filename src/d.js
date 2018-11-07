const Canvas = require('drawille');

const c = new Canvas(160, 160);

const main = async () => {
  for (let i = 0; i < 160; i++) {
    c.set(i, i);
    c.set(i, 0);
    c.set(i, 1);

    c.set(0, i);
    c.set(1, i);
    c.set(i, 160 - i);
    c.set(160 - i, i);
    // process.stdout.write('\033c');
    process.stdout.write(c.frame());
    await new Promise(p => setTimeout(p, 10));
  }
}
main();
