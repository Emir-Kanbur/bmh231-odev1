// Testlerde yalnızca Node.js'in yerleşik araçları kullanılır; ek paket yoktur.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const vm = require('node:vm');
const dayjs = require('dayjs');

const adres = 'http://localhost:3000';

test('Gerçek HTTP sunucusu: yollar, UTF-8, yöntemler ve loglar', async (t) => {
  const child = spawn(process.execPath, ['sunucu.js'], {
    cwd: `${__dirname}/..`, env: { ...process.env, TZ: 'Europe/Istanbul' },
  });
  let log = '';
  let hata = '';
  child.stdout.on('data', (data) => { log += data; });
  child.stderr.on('data', (data) => { hata += data; });
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Sunucu başlamadı: ' + hata)), 5000);
      child.stdout.on('data', () => {
        if (log.includes('Sunucu:')) { clearTimeout(timeout); resolve(); }
      });
      child.once('error', (error) => { clearTimeout(timeout); reject(error); });
      child.once('exit', (code) => {
        if (code) { clearTimeout(timeout); reject(new Error(hata)); }
      });
    });
    const yollar = [
      ['/', 'text/html', '<h1>BMH231'],
      ['/hakkimda', 'text/html', 'Bilgisayar mühendisliği'],
      ['/api/ders', 'application/json', 'Cuma'],
      ['/api/agep', 'application/json', '01.11.2026'],
    ];
    for (const [yol, tur, metin] of yollar) {
      await t.test(`GET ${yol}`, async () => {
        const r = await fetch(adres + yol);
        assert.equal(r.status, 200);
        assert.equal(r.headers.get('content-type'), tur + '; charset=utf-8');
        const body = await r.text();
        assert.ok(body.includes(metin));
        if (yol === '/') assert.ok(body.includes('href="/hakkimda"'));
        if (yol === '/api/ders') assert.deepEqual(JSON.parse(body), {
          kod: 'BMH231', ad: 'Web Programlama', gun: 'Cuma',
        });
        if (yol === '/api/agep') {
          const expected = Math.max(0, dayjs('2026-11-01').startOf('day')
            .diff(dayjs().startOf('day'), 'day'));
          assert.deepEqual(JSON.parse(body), { sonTeslim: '01.11.2026', kalanGun: expected });
        }
      });
    }
    await t.test('404 gövdesi birebir aynı', async () => {
      const r = await fetch(adres + '/olmayan-sayfa');
      assert.equal(r.status, 404);
      assert.equal(r.headers.get('content-type'), 'text/plain; charset=utf-8');
      assert.equal(await r.text(), 'Sayfa bulunamadı');
    });
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
      await t.test(`${method}: bilinen ve bilinmeyen yolda öncelikle 405`, async () => {
        for (const yol of ['/api/ders', '/olmayan-sayfa']) {
          const r = await fetch(adres + yol, { method });
          assert.equal(r.status, 405);
          assert.equal(r.headers.get('allow'), 'GET');
          assert.equal(r.headers.get('content-type'), 'text/plain; charset=utf-8');
          if (method === 'HEAD') assert.equal(await r.text(), '');
          else assert.equal(await r.text(), 'Yönteme izin verilmiyor');
        }
      });
    }
    await t.test('Query rotayı değiştirmez; her isteğin METHOD/PATH logu bulunur', async () => {
      const r = await fetch(adres + '/api/ders?deneme=1');
      assert.equal(r.status, 200);
      await r.text();
      for (const [yol] of yollar) assert.ok(log.includes(`GET ${yol}`));
      assert.ok(log.includes('POST /api/ders'));
      assert.ok(log.includes('GET /api/ders'));
    });
  } finally {
    if (child.exitCode === null) { child.kill(); await once(child, 'exit'); }
  }
});

test('AGEP: aynı çalışan handler her istekte tarihi yeniden hesaplar', () => {
  // VM yalnızca saati ve ağ dinleyicisini denetler; gerçek sunucu kodu ve dayjs çalışır.
  let simdi = '2026-10-21T23:59:59';
  let handler;
  const source = fs.readFileSync(`${__dirname}/../sunucu.js`, 'utf8');
  vm.runInNewContext(source, {
    console: { log() {} },
    require(name) {
      if (name === 'node:http') return {
        createServer(fn) { handler = fn; return { listen() {} }; },
      };
      if (name === 'dayjs') return (value) => dayjs(value === undefined ? simdi : value);
      throw new Error('Beklenmeyen bağımlılık: ' + name);
    },
  });
  for (const [tarih, expected] of [
    ['2026-10-21T00:00:01', 11], ['2026-10-21T23:59:59', 11],
    ['2026-10-22T00:00:01', 10], ['2026-10-31T23:59:59', 1],
    ['2026-11-01T00:00:00', 0], ['2026-11-02T12:00:00', 0],
  ]) {
    simdi = tarih;
    let body;
    handler({ method: 'GET', url: '/api/agep' }, {
      writeHead(code) { assert.equal(code, 200); }, end(text) { body = JSON.parse(text); },
    });
    assert.equal(body.kalanGun, expected, tarih);
  }
});
