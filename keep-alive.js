const { spawn } = require('child_process');

function startTunnel() {
    console.log("Starting localtunnel...");
    const tunnel = spawn('npx', ['localtunnel', '--port', '8080', '--subdomain', 'nexus-ultra-ai-web'], { shell: true });
    
    tunnel.stdout.on('data', (data) => {
        const out = data.toString();
        console.log(out);
    });
    tunnel.stderr.on('data', (data) => console.error(data.toString()));
    
    tunnel.on('close', (code) => {
        console.log(`Tunnel closed with code ${code}. Restarting in 3 seconds...`);
        setTimeout(startTunnel, 3000);
    });
}

startTunnel();
