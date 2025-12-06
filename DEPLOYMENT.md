# HairBook - Deployment Guide

## 🚀 Možnosti deploye

### 1. Railway (Doporučeno - nejjednodušší)

**Výhody:**
- ✅ Podporuje SQLite out-of-the-box
- ✅ Automatická detekce Next.js
- ✅ Free tier dostačující pro začátek
- ✅ Jednoduchá správa databáze

**Postup:**
1. Zaregistrujte se na [railway.app](https://railway.app)
2. Klikněte na "New Project" → "Deploy from GitHub repo"
3. Vyberte repozitář `HairBook-New`
4. Railway automaticky:
   - Nainstaluje dependencies
   - Spustí `prisma generate`
   - Build aplikaci
   - Nasadí na URL
5. Nastavte environment variables:
   - `DATABASE_URL=file:./prisma/dev.db`
   - `NEXTAUTH_SECRET=<vygenerujte si tajný klíč>`
   - `NEXTAUTH_URL=<vaše Railway URL>`

**Generování NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

---

### 2. Vercel (S PostgreSQL)

**Poznámka:** Vercel má read-only filesystem, proto SQLite nefunguje.
Musíte přejít na PostgreSQL.

**Postup:**
1. Zaregistrujte se na [vercel.com](https://vercel.com)
2. Import GitHub repozitáře
3. Vytvořte PostgreSQL databázi (např. na [Supabase](https://supabase.com) nebo [Neon](https://neon.tech))
4. Nastavte environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   NEXTAUTH_SECRET=<tajný klíč>
   NEXTAUTH_URL=<vaše Vercel URL>
   ```
5. Vercel automaticky buildne a nasadí aplikaci

**Migrace na PostgreSQL:**
```bash
# 1. Změňte provider v schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# 2. Vygenerujte novou migraci
npx prisma migrate dev --name init

# 3. Push schema do produkční databáze
npx prisma db push
```

---

### 3. VPS/Dedikovaný server

**Pro větší kontrolu můžete nasadit na vlastní server:**

1. **Připravte server:**
```bash
# Instalace Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalace PM2 (process manager)
sudo npm install -g pm2
```

2. **Naklonujte repozitář:**
```bash
git clone https://github.com/supervisor-bit/HairBook-New.git
cd HairBook-New
npm install
```

3. **Nastavte .env:**
```bash
cp .env.example .env
nano .env  # editujte hodnoty
```

4. **Build a spuštění:**
```bash
npm run build
pm2 start npm --name "hairbook" -- start
pm2 save
pm2 startup  # automatické spuštění při restartu
```

5. **Nginx jako reverse proxy:**
```nginx
server {
    listen 80;
    server_name vase-domena.cz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📋 Checklist před deployem

- [ ] Vygenerován `NEXTAUTH_SECRET`
- [ ] Nastavena správná `NEXTAUTH_URL`
- [ ] Zkontrolována databázová URL
- [ ] Přidány všechny environment variables
- [ ] Otestován production build lokálně:
  ```bash
  npm run build
  npm start
  ```
- [ ] Commitnuty všechny změny do Gitu
- [ ] Pushnuto do GitHub repozitáře

---

## 🔧 Environment Variables

**Povinné:**
- `DATABASE_URL` - URL k databázi
- `NEXTAUTH_SECRET` - Tajný klíč pro autentizaci
- `NEXTAUTH_URL` - URL vaší aplikace (např. https://hairbook.railway.app)

**Příklad .env:**
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="vygenerovaný-tajný-klíč"
NEXTAUTH_URL="https://your-app.railway.app"
```

---

## 🐛 Troubleshooting

**Build failuje:**
- Zkontrolujte, že `prisma generate` proběhl úspěšně
- Ujistěte se, že máte všechny dependencies v `package.json`

**Databáze nefunguje:**
- Pro SQLite: Ujistěte se, že filesystem je writable
- Pro PostgreSQL: Zkontrolujte connection string

**Session error:**
- Zkontrolujte `NEXTAUTH_SECRET` a `NEXTAUTH_URL`
- URL musí odpovídat skutečné adrese aplikace

---

## 📚 Doporučené služby

**Databáze (pro produkci):**
- [Supabase](https://supabase.com) - PostgreSQL, free tier 500MB
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [PlanetScale](https://planetscale.com) - MySQL

**Hosting:**
- [Railway](https://railway.app) - $5/měsíc, 500h free
- [Vercel](https://vercel.com) - Free pro hobby projekty
- [Render](https://render.com) - Free tier dostupný

---

## 🚀 Quick Deploy na Railway

```bash
# 1. Push do GitHubu (už máte)
git push

# 2. Railway CLI (volitelné)
npm i -g @railway/cli
railway login
railway init
railway up

# 3. Nebo přes web interface (jednodušší)
# → Jděte na railway.app
# → New Project → Deploy from GitHub
# → Vyberte HairBook-New
# → Nastavte env variables
# → Deploy! 🎉
```
