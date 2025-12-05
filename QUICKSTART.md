# 🚀 Rychlý start - HairBook

## První spuštění

### 1. Kontrola závislostí
```bash
npm install
```

### 2. Inicializace databáze
```bash
npx prisma generate
npx prisma db push
```

### 3. (Volitelné) Naplnění testovacími daty
```bash
npm run seed
```
Toto vytvoří:
- Testovacího uživatele (heslo: `admin`)
- Skupiny klientů
- Vzorové služby
- Vzorové materiály
- 5 vzorových klientů

### 4. Spuštění aplikace
```bash
npm run dev
```

Aplikace poběží na `http://localhost:3000`

## 🎯 První přihlášení

### Bez seed dat (čistý start):
1. Otevřete `http://localhost:3000`
2. Budete přesměrováni na `/setup`
3. Vytvořte si heslo
4. Přihlaste se

### Se seed daty:
1. Otevřete `http://localhost:3000/login`
2. Heslo: `admin`
3. Přihlaste se

## 📱 Základní používání

### Přidání prvního klienta
1. Klikněte na 👥 v menu
2. Klikněte "+ Přidat klienta"
3. Vyplňte jméno, příjmení a telefon
4. Uložte

### Vytvoření návštěvy
1. Vyberte klienta ze seznamu
2. Klikněte "Nová návštěva"
3. Přidejte služby
4. Přidejte materiály ke službám
5. Uzavřete návštěvu (odepíše materiály)

### Přidání materiálu
1. Klikněte na 📦 v menu
2. Nejprve vytvořte skupinu (např. "Barvy")
3. Klikněte "+ Přidat materiál"
4. Vyplňte údaje:
   - Název
   - Skupina
   - Jednotka (g/ml/ks)
   - Velikost balení
   - Počáteční stav
5. Uložte

### Správa skladu
1. Vyberte materiál
2. Klikněte "+ Nový pohyb"
3. Vyberte typ (Příjem/Výdej)
4. Zadejte množství v kusech
5. Přidejte poznámku (volitelné)

## 🔧 Produkční build

```bash
npm run build
npm start
```

## 🗄️ Reset databáze

Pokud chcete začít znovu:
```bash
rm prisma/dev.db
npx prisma db push
npm run seed  # volitelné
```

## 💡 Tipy

- **Rychlé vytvoření návštěvy**: Tlačítka služeb v pravém panelu POS obrazovky
- **Přepočet materiálů**: Systém automaticky přepočítá g/ml na kusy při uzavření návštěvy
- **Skupiny**: Vytvářejte vlastní skupiny pro lepší organizaci klientů i materiálů
- **POS interface**: Navrženo pro dotykové obrazovky a rychlou obsluhu

---

**Máte otázky?** Podívejte se do `README.md` pro detailní dokumentaci.
