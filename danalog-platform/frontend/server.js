
import { spawn } from 'child_process';

const port = process.env.PORT || 3000;
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log(`Starting server on port ${port}...`);

const serve = spawn(cmd, ['serve', '-s', 'dist', '-l', String(port)], {
    stdio: 'inherit',
    shell: true
});

serve.on('close', (code) => {
    process.exit(code);
});
