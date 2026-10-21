# BMH231 Ödev 1

BMH231 Web Programlama dersi için HTTP isteklerini, içerik türlerini, JSON yanıtlarını ve Git dallarıyla çalışmayı gösteren küçük bir Node.js sunucusu. Uygulama yalnızca Node.js'in yerleşik `http` modülünü ve `dayjs` paketini kullanır.

## Gereksinimler ve çalıştırma

Node.js LTS, npm ve klonlama için Git gerekir.

```sh
git clone https://github.com/Emir-Kanbur/bmh231-odev1.git
cd bmh231-odev1
npm install
npm start
```

Tarayıcıda <http://localhost:3000> adresini açın. Sunucu 3000 portunu kullanır; durdurmak için terminalde Ctrl+C tuşlarına basın. Her isteğin yöntemi ve yolu terminale yazılır: `GET /api/ders` gibi.

## Yollar ve yanıtlar

| Yöntem ve yol | Durum | İçerik türü | İçerik |
| --- | --- | --- | --- |
| `GET /` | 200 | `text/html; charset=utf-8` | Başlık ve `/hakkimda` bağlantısı |
| `GET /hakkimda` | 200 | `text/html; charset=utf-8` | Kısa öğrenci tanıtımı ve ana sayfa bağlantısı |
| `GET /api/ders` | 200 | `application/json; charset=utf-8` | Ders kodu, adı ve doğrulanmış ders günü |
| `GET /api/agep` | 200 | `application/json; charset=utf-8` | AGEP son teslim tarihi ve kalan takvim günü |
| Diğer bütün GET yolları | 404 | `text/plain; charset=utf-8` | Tam olarak `Sayfa bulunamadı` |
| GET dışındaki yöntemler, bütün yollar | 405 | `text/plain; charset=utf-8` | `Yönteme izin verilmiyor`; ayrıca `Allow: GET` |

Yöntem kontrolü yol kontrolünden önce yapılır: örneğin `POST /olmayan-sayfa` da 405 döndürür. HTTP gereği HEAD yanıtının gövdesi aktarılmaz. Sorgu kısmı rota seçiminden ayrılır; `/api/ders?deneme=1` aynı ders yanıtını verir. Türkçe metinler UTF-8 olarak aktarılır.

`GET /api/ders` yanıtı:

```json
{"kod":"BMH231","ad":"Web Programlama","gun":"Cuma"}
```

`GET /api/agep` yanıt yapısı, 21.10.2026 tarihi için açıklayıcı örnek:

```json
{"sonTeslim":"01.11.2026","kalanGun":11}
```

Bu örnek bir ölçüm kaydı değildir; gerçek `kalanGun` değeri isteğin yapıldığı güne bağlıdır. Her istekte bugünün ve 1 Kasım 2026'nın tarihleri `dayjs` ile yeniden hesaplanır. İkisi de `startOf('day')` ile gün başlangıcına alınır, aradaki takvim günü bulunur. Teslim günü ve sonrasında sonuç 0'a sabitlenir.

`dayjs` sunucunun yerel saat dilimini kullanır; geliştirme cihazında bu `Europe/Istanbul` olarak ayarlıdır. Başka saat dilimine sahip bir sunucuda Türkiye takvimine göre çalıştırmak için macOS/Linux üzerinde:

```sh
TZ=Europe/Istanbul npm start
```

## Doğrulama

Otomatik testlerden önce 3000 portunda çalışan sunucuyu durdurun; test kendi sunucusunu başlatır ve bitince kapatır.

```sh
npm test
```

Testler Node.js'in yerleşik test, HTTP istemcisi ve süreç araçlarıyla çalışır; yeni bir paket gerektirmez. Yollar, Türkçe JSON, içerik türleri, 404 gövdesi, bilinen/bilinmeyen yollarda GET dışı yöntemlerin 405 yanıtı ve `Allow` başlığı denetlenir. AGEP hesabı gün değişimi, teslim günü ve teslim sonrası için ayrıca sınanır. Test komutu saat dilimini `Europe/Istanbul` olarak ayarlar.

Sunucuyu `npm start` ile çalıştırdıktan sonra ayrı terminalde ödevin altı kontrolünü uygulayın:

```sh
curl -i http://localhost:3000/
curl -i http://localhost:3000/hakkimda
curl -i http://localhost:3000/api/ders
curl -i http://localhost:3000/api/agep
curl -i http://localhost:3000/olmayan-sayfa
curl -i -X POST http://localhost:3000/api/ders
```

Beklenen durum sırası 200, 200, 200, 200, 404, 405'tir. Rapor kanıtları bu komutların gerçekten alınmış başlıkları ve gövdelerinden oluşmalıdır.

## Git çalışması

Geliştirme mantıklı aşamalar halinde commit'lenmiştir. `/hakkimda` sayfası `hakkimda` dalında geliştirilip `main` dalına ayrı merge kaydıyla birleştirilmiştir. `baslik` ve `main` dallarında aynı `<h1>` satırının farklı değiştirilmesiyle gerçek bir çakışma oluşturulmuş, çakışma işaretleri kaydedildikten sonra ortak başlık seçilerek çözülmüştür. Geçmişi incelemek için:

```sh
git log --oneline --graph --all
```

## Dosyalar ve kişisel veriler

```text
bmh231-odev1/
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── sunucu.js
└── test/
    └── sunucu.test.js
```

`package.json` ve `package-lock.json` depoda tutulur; `node_modules/`, `.env` ve yerel `kanitlar/` klasörü `.gitignore` ile dışarıda bırakılır. Bağımlılıklar `npm install` ile kurulur. Kanıtların Git tarafından dışlanması tek başına gizlilik garantisi değildir: dosyaları paylaşmadan önce inceleyin. Çerez değerlerini, erişim belirteçlerini, oturum bilgilerini, öğrenci numarasını ve diğer özel verileri herkese açık depoya eklemeyin. Rapor için gereken kişisel bilgileri ayrı teslim belgesinde tutun; ekran görüntülerinde kişisel hesap ayrıntılarını gizleyin.
