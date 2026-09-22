# Defter

Yirmi dört metinlik kişisel gelişim serisinin uygulama defteri. Kırk sekiz hafta, sekiz program, aynı anda tek program. Her gün tek iş, birkaç dakika.

Telefonda çalışır, internet olmadan açılır. Kayıtlar cihazda durur; istenirse iki cihaz arasında eşitlenir.

## Nasıl işler

**Bugün.** Her gün tek kart: programın bugünkü işi, senin yazdığın "ne zaman, nerede" cümlesi ve tek düğme, *Yaptım*. Kötü günler için *Zor gün* düğmesi programın asgari sürümünü gösterir; onu yapmak da zinciri korur. Tek kaçırma zinciri koparmaz, üst üste iki kaçırma koparır. Günün ayrıntılı adımları *Nasıl yapılır?* altındadır.

**Günü gelen işler.** Pazar gözden geçirmesi, ay sonu oturumu, okunacak metin ve tekrarlar yalnızca zamanı gelince kart olarak çıkar. Her biri adım adım ilerler: her ekranda tek soru.

**Program geçişi.** Program bitince tek soru: varış ölçütü tuttu mu? Tuttuysa yerleşen alışkanlıklar ayrılır ve sıradaki program tanıtılır. Tutmadıysa program iki hafta uzar, takvim kendiliğinden kayar.

**Yol.** Bulunduğun hafta, sekiz programın durumu ve sıradaki dönüm noktası. Kırk dokuz haftalık takvimin tamamı da buradan açılır.

**Kitaplık.** Yirmi altı metin; sıradaki okuma en üstte. Metinler arası 841 atıf tıklanabilir, kaldığın bölüm saklanır. Her metin okunduktan sonra üç soruluk bir kayıt ister; bölüm sonlarındaki "Kapat ve hatırla" soruları kapalı kitapla cevaplanabilir.

**Daha fazla.** Kayıtlar, programların araçları, dönüm noktaları, zor anlar kartı, yıllık kayıt okuması, ara verme ve ayarlar.

## Telefona kurmak

- **iPhone:** Safari'de sitenin adresini aç → *Paylaş* → *Ana Ekrana Ekle*.
- **Android:** Chrome'da aç → menü → *Uygulamayı yükle*.

İlk açılışta kısa bir kurulum başlangıç tarihini sorar. Seçilen tarih Hafta 1'in pazartesisidir; ondan önceki hafta hazırlık haftasıdır.

## Kayıtlar

Kayıtlar tarayıcının deposunda durur (`localStorage`, anahtar `defter.v1`). Uygulama tarayıcıdan kalıcı depolama izni ister.

- *Ayarlar → Yedeği indir* bütün kayıtları tek bir JSON dosyasına yazar. *Yedekten yükle* mevcut kayıtlarla birleştirir, hiçbir şeyi silmez.
- Senkron kapalıyken uygulama yedeği kendisi hatırlatır: hiç yedek alınmadıysa ikinci haftadan itibaren, alındıysa otuz gün sonra.
- Uygulamayı ana ekrandan silmek o cihazdaki kayıtları silebilir. Kalıcı güvence senkron ya da yedektir.

## Senkron (isteğe bağlı)

Telefon ve bilgisayar aynı defteri görsün diye Firebase kullanılır. `firebase-config.js` boş kalırsa uygulama yalnızca cihazda çalışır.

1. [Firebase konsolunda](https://console.firebase.google.com) yeni bir proje aç. Analytics gerekmez.
2. *Authentication → Sign-in method* bölümünde **Email/Password**'ü etkinleştir. *Settings → Authorized domains* bölümüne sitenin alan adını ekle.
3. *Firestore Database → Create database* ile veritabanını production mode'da oluştur. *Rules* sekmesine şunu yapıştırıp yayınla:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /defterler/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

4. *Proje ayarları → Uygulamalarınız* bölümünden bir web uygulaması ekle. Gösterilen yapılandırmayı `firebase-config.js` dosyasına yaz:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...firebaseapp.com",
     projectId: "...",
     appId: "..."
   };
   ```

5. Uygulamada *Ayarlar → Senkron → Hesap oluştur*. Diğer cihazda aynı e-posta ve şifreyle *Giriş yap*.

`apiKey` gizli bir anahtar değildir; erişimi giriş ve yukarıdaki kural sınırlar: herkes yalnızca kendi defterini okuyup yazabilir. Her kayıt kendi zaman damgasıyla birleşir; aynı kayıt iki cihazda değişirse son yazılan kazanır.

Bütün defter tek bir Firestore belgesinde durur; belge sınırı 1 MB'tır. Tipik bir yıl bunun altında kalır. *Ayarlar* kayıt boyutunu gösterir; sınır aşılırsa uygulama buluta yazmayı durdurur ve nedenini söyler.

## Güncellemek

Dosyalar değiştiğinde `sw.js` dosyasının ilk satırındaki sürüm değeri de değişir. Uygulama bir sonraki açılışta "Yeni sürüm hazır" der; dokununca güncellenir.

## Dosyalar

| Dosya | Görevi |
|---|---|
| `index.html`, `styles.css`, `app.js` | Uygulama |
| `data.js` | Metinlerden derlenmiş içerik |
| `sw.js` | Çevrimdışı çalışma |
| `manifest.webmanifest`, `*.png` | Ana ekrana kurulum ve simgeler |
| `firebase-config.js` | Senkron ayarları |

Uygulama tek bir sayfadır; derleme adımı ve bağımlılığı yoktur. Firebase yalnızca yapılandırılmışsa yüklenir.
