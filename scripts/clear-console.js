const isWindows = process.platform === 'win32';
const CLEAR = isWindows ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H';
process.stdout.write(CLEAR);
