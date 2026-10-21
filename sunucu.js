const http = require('node:http');

const sunucu = http.createServer((istek, yanit) => {
  const yol = istek.url.split('?')[0];
  console.log(`${istek.method} ${yol}`);
  yanit.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  yanit.end('BMH231 sunucusu çalışıyor');
});

sunucu.listen(3000, () => {
  console.log('Sunucu: http://localhost:3000');
});
