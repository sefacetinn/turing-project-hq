# Turing Project HQ - Kullanim Kilavuzu

## Baslatma

### Local Server ile Calistirma (Onerilen)

```bash
cd "/Users/sefacetin/Desktop/turing/turing ss/screenshots/project-hq"
python3 -m http.server 5173
```

Tarayicida: http://localhost:5173

### Dogrudan Dosya ile Acma

`index.html` dosyasini dogrudan tarayicida acabilirsiniz, ancak JSON fetch islemi CORS nedeniyle calismayabilir. Bu durumda:

1. "Export/Import" sekmesine gidin
2. `data/project-hq.json` dosyasini import edin

---

## Ozellikler

### 1. Overview (Genel Bakis)
- Proje durumu ve release readiness
- Blocker listesi
- Hizli linkler
- Ortamlar (Preview/Production)

### 2. Product & App Logic
- Urun ozeti ve hedef kullanicilar
- Modul listesi
- Kullanici akislari (flows)

### 3. Roles & Permissions
- Hesap modeli aciklamasi
- Rol tanimlari
- Permission matrisi
- Gorunurluk kurallari

### 4. Architecture
- Dizin yapisi
- Frontend/Backend siniri
- Observability araclari

### 5. Tech Stack
- Kullanilan teknolojiler ve versiyonlar
- SDK/servis envanteri
- Environment variable listesi

### 6. Firebase & Security
- Collection listesi ve indexler
- Security rules notlari
- Yaygin hatalar ve cozumleri
- Feature flags
- Debug tarifleri

### 7. Payments
- Odeme akisi
- Abonelik planlari
- Risk notlari
- Test kartlari

### 8. Admin Portal
- Route listesi
- Yetki tanimlari
- Support islemleri

### 9. QA / Screenshots
- Test cihazlari listesi
- Test case kutuphanesi
- Release checklist
- Legacy rapor linki

### 10. Backlog & Sprint
- Issue tablosu (filtreleme, siralama)
- Sprint yonetimi
- Definition of Done

### 11. Builds & Releases
- Build gecmisi
- Release notes sablonu

### 12. Store Compliance
- Apple App Store checklist
- Google Play checklist
- Privacy labels
- Rejection history

### 13. Docs & Links
- Tum linklerin kategorili listesi
- Arama ozelligi

### 14. Changelog
- Degisiklik gecmisi

### 15. Export / Import
- JSON export/import
- CSV export (issues, builds, links)
- Print/PDF

---

## Veri Yonetimi

### Otomatik Kayit
Veriler tarayici localStorage'inda saklanir. Her degisiklik otomatik kaydedilmez; "Save" butonuna tiklayin.

### Export
- JSON: Tum veriyi tek dosyada indirir
- CSV: Issues, Builds veya Links'i ayri ayri export eder

### Import
- JSON dosyasini drop-zone'a surekileyip birakin veya tiklayin
- Mevcut veriler uzerine yazilir

### Temizleme
"Clear All Data" butonu tum localStorage verisini siler.

---

## Klavye Kisayollari

- `Cmd/Ctrl + S`: Kaydet
- `Escape`: Modal kapat

---

## Legacy Rapor Entegrasyonu

Mevcut `revizyon_raporu.html` dosyasi korunmustur. QA sekmesinden dogrudan acilabilir:

1. "Open Legacy Report" butonu
2. "Open Dev Dashboard" butonu (Screenshots tarayicisi)

---

## Dosya Yapisi

```
project-hq/
├── index.html          # Ana HTML
├── styles.css          # Tum stiller
├── app.js              # Uygulama mantigi
├── data/
│   ├── project-hq.json # Veri dosyasi
│   └── schema.md       # Sema dokumantasyonu
├── docs/
│   └── README.md       # Bu dosya
└── legacy/             # Eski raporlar icin
```

---

## Dikkat Edilecekler

1. **Hassas bilgi**: API key, secret gibi bilgileri JSON'da saklamayin
2. **Yedekleme**: Duzneili olarak JSON export yapin
3. **Tarayici uyumlulugu**: Modern tarayicilar (Chrome, Safari, Firefox) desteklenir
4. **CORS**: Local server kullanilmasi onerilir

---

## Sorun Giderme

### JSON yuklenmiyor
- Local server calistirdiginizdan emin olun
- Veya JSON'u manuel import edin

### Stiller bozuk gorunuyor
- `styles.css` dosyasinin dogru yolda oldugundan emin olun
- Hard refresh yapin (Cmd+Shift+R)

### Veriler kayboldu
- localStorage temizlenmis olabilir
- Son export'u import edin
