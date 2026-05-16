const { spawn } = require('child_process');

const surge = spawn('npx', ['surge', './www', 'nexus-ai-ultra-final.surge.sh'], { shell: true });

surge.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[SURGE] ${output}`);
    
    if (output.toLowerCase().includes('email:')) {
        surge.stdin.write('nexus.ai.commander.v2@gmail.com\n');
    }
    if (output.toLowerCase().includes('password:')) {
        surge.stdin.write('NexusUltra2026!!!\n');
    }
});

surge.stderr.on('data', (data) => {
    console.error(`[ERR] ${data.toString()}`);
});

surge.on('close', (code) => {
    console.log(`Surge process exited with code ${code}`);
});
