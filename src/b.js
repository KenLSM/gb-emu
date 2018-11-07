var blessed = require('blessed'),
  program = blessed.program();

program.key('q', function(ch, key) {
  program.clear();
  program.disableMouse();
  program.showCursor();
  program.normalBuffer();
  process.exit(0);
});

program.on('mouse', function(data) {
  if (data.action === 'mousemove') {
    program.move(data.x, data.y);
    program.bg('red');
    program.write('x');
    program.bg('!red');
  }
});

program.alternateBuffer();
program.enableMouse();
program.hideCursor();
program.clear();


const main = async () => {
  for (let i = 0; i < 160; i++) {
    program.clear();
    program.move(i, i);
    program.bg('black');
    program.write('Hello world', 'blue fg');
    program.setx((program.cols / 2 | 0) - 4);
    program.write(`col ${program.cols}`);
    program.down(1);
    program.write(`rows ${program.rows}`);
    program.down(5);
    program.write('Hi again!');
    program.bg('!black');
    program.feed();
    await new Promise(p => setTimeout(p, 10));
  }
};

main();
