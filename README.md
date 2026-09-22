# Defter

Serinin uygulama defteri: yirmi dört metin, kırk sekiz haftalık takvim, sekiz program, testler, kart ve mühürler. Telefonda çalışır, çevrimdışı açılır, istenirse iki cihaz arasında Firebase ile eşitlenir.

## İçinde ne var

- **Bugün** — haftanın satırı; aktif programın günü, çarpısı ve iki gün kuralı zinciri; okunacak metin; tekrarı gelen kayıtlar; pazar ve aylık oturum hatırlatmaları.
- **Yol** — kırk dokuz haftalık ızgara, fazlar, programların durumu ve tahmini mezuniyet tarihi. Uzatma ve kesintilerle birlikte kayar.
- **Kitaplık** — yirmi altı metin, bölüm bölüm. Metinler arası 840 atıf tıklanabilir; kaldığın bölüm saklanır.
- **Testler** — her metnin "kendini yerleştir" testi. Sonucun ne demek olduğunu ve hangi bölümlere ağırlık vereceğini gösterir; önceki sonuçla yan yana koyar.
- **Defter** — A: metin kayıtları, B: program günlüğü, C: arka plan, ve değerler ile yeterince tanımları.
- **Akışlar** — pazar gözden geçirmesi, aylık oturum, geçiş haftasının yedi adımı, kesinti, mezuniyet.
- **Kart** — tetiklenenler kartının on sekiz satırı; metinler okundukça açılır.
- **Mühürler** — kırk varış kaydı. Tarihli, bir kez basılan, puansız.

## Dosyalar

| Dosya | Ne |
|---|---|
| `index.html`, `styles.css`, `app.js` | Uygulama |
| `data.js` | Metinlerden derlenmiş içerik |
| `sw.js`, `manifest.webmanifest`, simgeler (`*.png`) | Çevrimdışı çalışma ve ana ekrana kurulum |
| `firebase-config.js` | Senkron ayarları; boş kalırsa uygulama yalnızca cihazda çalışır |
| `firestore.rules` | Firestore güvenlik kuralları |
| `icerik/` | Yirmi altı metnin kaynak dosyaları |
| `araclar/derle.py` | `icerik/` klasöründen `data.js` üretir |

