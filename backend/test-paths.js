const https = require('https');

console.log('Testing webhook endpoints with different paths...');

function testUrl(url) {
    return new Promise((resolve) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }, (res) => {
            console.log(`${url}: ${res.statusCode}`);
            resolve(res.statusCode);
        });
        
        req.on('error', () => {
            console.log(`${url}: ERROR`);
            resolve(0);
        });
        
        req.write('{}');
        req.end();
    });
}

async function testPaths() {
    await testUrl('https://coinbitclub-market-bot.up.railway.app/api/webhooks/signal?token=210406');
    await testUrl('https://coinbitclub-market-bot.up.railway.app/webhooks/signal?token=210406');
    await testUrl('https://coinbitclub-market-bot.up.railway.app/api/webhook/signal?token=210406');
    await testUrl('https://coinbitclub-market-bot.up.railway.app/webhook/signal?token=210406');
}

testPaths();
