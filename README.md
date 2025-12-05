# HairBook - Správa kadeřnictví

Moderní webová aplikace pro správu malého kadeřnictví s evidencí klientů, návštěv a materiálů.

## 🚀 Funkce

### ✂️ Autentizace
- První spuštění s možností vytvoření hesla
- Přihlášení heslem
- Zabezpečení všech stránek

### 👥 Klienti
- **Master-detail layout** se třemi panely (Skupiny | Seznam | Detail)
- Evidence jména, příjmení a telefonu
- Automatické generování avatarů z iniciálů
- Skupiny klientů (systémové i vlastní)
- Detail klienta s kartami:
  - 📋 Historie návštěv
  - 🏠 Produkty pro domácí použití
  - 📝 Poznámky

### 💇 Návštěvy (POS obrazovka)
- **Fullscreen POS interface** pro rychlou obsluhu
- Přidávání služeb z rychlého výběru
- Přiřazování materiálů ke službám
- Možnost zadat množství v **g, ml nebo ks**
- Dva stavy návštěvy:
  - **Uložená** - lze editovat, materiál není odepsán
  - **Uzavřená** - nelze editovat, materiál je odepsán
- Dialog při uzavření s:
  - Jménem klienta
  - Celkovou cenou
  - Poznámkou
  - Přehledem odepsaných materiálů

### 📦 Materiály
- **Master-detail layout** se třemi panely
- Skupiny materiálů (Barvy, Šampony, Styling...)
- Evidované údaje:
  - Název materiálu
  - Skupina
  - Jednotka (g, ml, ks)
  - Velikost balení
  - Stav skladu v kusech
- **Historie pohybů** každého materiálu:
  - Příjem
  - Výdej
  - Použití v návštěvě
- **Automatický přepočet** při odpisu:
  - 50g z balení 100g = odepsáno 0.5 ks
  - 30ml z láhve 500ml = odepsáno 0.06 ks

### ⚙️ Nastavení
- Číselník služeb
- Správa skupin

## 🛠️ Technologie

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite + Prisma ORM
- **Authentication:** bcryptjs + cookies
- **Backend:** Next.js API Routes

## 📦 Instalace

```bash
# Instalace závislostí
npm install

# Inicializace databáze
npx prisma generate
npx prisma db push

# Spuštění vývojového serveru
npm run dev
```

Aplikace poběží na `http://localhost:3000`

## 🎯 První spuštění

1. Otevřete aplikaci v prohlížeči
2. Budete přesměrováni na `/setup`
3. Vytvořte heslo (min. 4 znaky)
4. Systém vytvoří výchozí skupiny klientů
5. Přihlaste se s vytvořeným heslem

## 📁 Struktura projektu

```
src/
├── app/
│   ├── (dashboard)/         # Chráněné stránky
│   │   ├── clients/         # Sekce klientů
│   │   │   └── [id]/visit/new/  # POS obrazovka
│   │   ├── materials/       # Sekce materiálů
│   │   ├── settings/        # Nastavení
│   │   └── dashboard/       # Dashboard
│   ├── api/                 # API endpointy
│   │   ├── auth/            # Autentizace
│   │   ├── clients/         # Klienti
│   │   ├── visits/          # Návštěvy
│   │   └── materials/       # Materiály
│   ├── login/               # Přihlášení
│   └── setup/               # První nastavení
├── lib/
│   └── prisma.ts            # Prisma client
└── middleware.ts            # Auth middleware

prisma/
├── schema.prisma            # Databázové schéma
└── dev.db                   # SQLite databáze
```

## 🎨 UI Vlastnosti

- **Fixed layout** - žádné scrollování celé stránky
- **Master-detail** - 3 panely (Skupiny | Seznam | Detail)
- **POS interface** - velká tlačítka pro rychlou obsluhu
- **Responzivní** - přizpůsobení pro různé velikosti obrazovek
- **Moderní design** - čistý, minimalistický vzhled

## 📊 Databázové modely

- `User` - uživatel aplikace
- `Client` - klient kadeřnictví
- `ClientGroup` - skupiny klientů
- `ClientNote` - poznámky ke klientům
- `HomeProduct` - produkty pro domácí použití
- `Visit` - návštěva klienta
- `VisitService` - služba v návštěvě
- `VisitMaterial` - materiál použitý ve službě
- `Service` - služba
- `ServiceGroup` - skupina služeb
- `Material` - materiál
- `MaterialGroup` - skupina materiálů
- `MaterialMovement` - pohyb materiálu

## 🔐 Bezpečnost

- Heslo hashované pomocí bcryptjs
- HTTP-only cookies pro session
- Middleware pro ochranu routes
- Validace na backend straně

## 🚀 Produkce

```bash
# Build aplikace
npm run build

# Spuštění produkční verze
npm start
```

## 📝 Licence

Tento projekt je vytvořen pro účely malého kadeřnictví.

---

**Vytvořeno s ❤️ pomocí GitHub Copilot**
