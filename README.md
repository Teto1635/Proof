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

## 1. GitHub Pages'e yükle

1. GitHub'da yeni bir depo aç, örneğin `defter`. Ücretsiz planda Pages yalnızca herkese açık depolarda çalışır; gizli depo için GitHub Pro gerekir. Kayıtların depoda değil — cihazda ve Firebase'de.
2. Bu klasördeki her şeyi deponun köküne yükle: web arayüzünde *Add file → Upload files*, ya da git ile.
3. *Settings → Pages → Build and deployment*: Source *Deploy from a branch*, Branch `main`, klasör `/ (root)`. Kaydet.
4. Bir iki dakika sonra adres: `https://KULLANICI-ADIN.github.io/defter/`

Bu hâliyle uygulama çalışır; kayıtlar yalnızca o cihazda tutulur.

### Depo gizli kalsın istersen: Firebase Hosting

Herkese açık depo, metinlerin de herkese açık olması demek. Aynı Firebase projesi ücretsiz barındırma da veriyor; depo gizli kalabilir:

```
npm install -g firebase-tools
firebase login
firebase init hosting     # public directory: .  single-page app: No  index.html üzerine yazılsın mı: No
firebase deploy
```

Adres `https://PROJE-ADIN.web.app` olur. Bu alan adı Authentication'da zaten yetkili; senkron kurulumunda yetkili alan adı eklemeye gerek kalmaz.

## 2. Firebase senkronu (isteğe bağlı)

Telefon ile bilgisayar aynı defteri görsün diye:

1. [console.firebase.google.com](https://console.firebase.google.com) → *Proje ekle*. Analytics gerekmez.
2. *Build → Authentication → Get started → Sign-in method* → **Email/Password** → etkinleştir.
3. *Authentication → Settings → Authorized domains* → *Add domain* → `KULLANICI-ADIN.github.io`
4. *Build → Firestore Database → Create database* → production mode → yakın bir bölge.
5. *Firestore → Rules* → `firestore.rules` dosyasının içeriğini yapıştır → *Publish*.
6. *Proje ayarları → Genel → Uygulamalarınız* → web simgesi (`</>`) → uygulamayı kaydet. Gösterilen `firebaseConfig` nesnesini `firebase-config.js` dosyasına yaz:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...firebaseapp.com",
     projectId: "...",
     appId: "..."
   };
   ```

7. `sw.js` dosyasının ilk satırındaki sürümü artır (`defter-1.0.0` → `defter-1.0.1`) ve iki dosyayı depoya yeniden yükle.
8. Uygulamada *Ayarlar → Senkron → Hesap oluştur*. Diğer cihazda aynı e-posta ve şifreyle *Giriş yap*.

`apiKey` gizli bir anahtar değil; erişimi giriş ve `firestore.rules` sınırlıyor: herkes yalnızca kendi defterini okuyup yazabilir.

## 3. Telefona kur

- **iPhone:** Safari'de adresi aç → *Paylaş* → *Ana Ekrana Ekle*.
- **Android:** Chrome'da adresi aç → menü → *Uygulamayı yükle*.

Kurulduktan sonra internet olmadan da açılır.

## Güncellemek

Herhangi bir dosya değişince `sw.js` içindeki sürümü artır. Uygulama bir sonraki açılışta "Yeni sürüm hazır" der; *Yenile* ile güncellenir.

## Metinleri değiştirmek

`icerik/` klasöründeki dosyaları düzenle, sonra:

```
pip install markdown
python3 araclar/derle.py
```

`data.js` yeniden üretilir. Sürümü artır, yükle.

## Veriler

- Kayıtlar tarayıcıda (`localStorage`, anahtar `defter.v1`) ve senkron açıksa Firestore'da `defterler/{uid}` belgesinde durur.
- Her kayıt kendi zaman damgasıyla birleşir. İki cihazda aynı kaydı değiştirirsen son yazılan kazanır; farklı kayıtlar birbirini ezmez.
- *Ayarlar → Yedeği indir* bütün kayıtları tek bir JSON dosyasına yazar. *Yedekten yükle* mevcut kayıtlarla birleştirir, hiçbir şeyi silmez.
