const http = require('node:http');

const sunucu = http.createServer((istek, yanit) => {
  const yol = istek.url.split('?')[0];
  console.log(`${istek.method} ${yol}`);
  if (yol === '/api/ders') {
    yanit.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    yanit.end(JSON.stringify({ kod: 'BMH231', ad: 'Web Programlama', gun: 'Cuma' }));
    return;
  }
  if (yol === '/') {
    yanit.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    yanit.end(`<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BMH231 Ödev 1</title>
</head>
<body>
  <h1>BMH231 Web Programlama</h1>
  <a href="/hakkimda">Hakkımda</a>
</body>
</html>`);
    return;
  }
  yanit.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  yanit.end('BMH231 sunucusu çalışıyor');
});

sunucu.listen(3000, () => {
  console.log('Sunucu: http://localhost:3000');
});
