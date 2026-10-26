# Shiftly

Urenregistratie voor jezelf en kleine teams: klok, banen, dashboard, CSV-export en bedrijven met uitnodigingen en urengoedkeuring. Dit project bouw ik stap voor stap voor mijn portfolio.

## Stack

- **Backend:** Laravel 12, PHP 8.2+
- **Frontend:** Inertia 2, React 19, TypeScript, Tailwind CSS 4, Vite
- **Database:** MySQL (lokaal en productie)
- **Tests:** PHPUnit met SQLite in het geheugen

## Vereisten

| Tool | Versie |
|------|--------|
| PHP | 8.2+ (extensies: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`) |
| Composer | 2.x |
| Node.js | 22 LTS aanbevolen |
| npm | meegeleverd met Node |
| MySQL | 8.x of MariaDB 10.x |

## Lokaal installeren

1. **Repository clonen**

   ```bash
   git clone https://github.com/efedilekci/Shiftly.git shiftly
   cd shiftly
   ```

2. **PHP- en JavaScript-afhankelijkheden**

   ```bash
   composer install
   npm install
   ```

3. **Omgeving**

   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

   Pas in `.env` minimaal aan:

   - `APP_URL=http://localhost:8000`
   - `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (en `DB_HOST` / `DB_PORT` indien nodig)

4. **Database**

   Maak een lege database aan, bijvoorbeeld `shiftly`, en voer migraties uit:

   ```bash
   php artisan migrate
   ```

5. **Optioneel: demodata**

   Vult testaccounts en een demo-bedrijf (**Bakkerij Demo**):

   ```bash
   php artisan db:seed
   ```

   | E-mail | Wachtwoord | Rol |
   |--------|------------|-----|
   | `admin@shiftly.test` | `password` | Platform-admin |
   | `sara@shiftly.test` | `password` | Gebruiker (eigenaar demo-bedrijf) |
   | `tom@shiftly.test` | `password` | Gebruiker (medewerker demo-bedrijf) |
   | `lisa@shiftly.test` | `password` | Gebruiker (open uitnodiging in inbox) |

   Gebruik deze accounts alleen in lokale of demo-omgevingen.

6. **Ontwikkelserver**

   Linux/macOS (met logtail via Pail):

   ```bash
   composer run dev
   ```

   Windows (Pail vereist `pcntl`, dat ontbreekt vaak op WAMP/XAMPP):

   ```bash
   composer run dev:win
   ```

   Open [http://localhost:8000](http://localhost:8000). Vite draait op poort 5173; Laravel serveert op 8000.

   Alternatief: twee terminals — `php artisan serve` en `npm run dev`.

## Site / productie opzetten

Voor een echte host (VPS, shared hosting met PHP, Laravel Forge, enz.):

1. **Code en dependencies**

   ```bash
   composer install --no-dev --optimize-autoloader
   npm ci
   npm run build
   ```

2. **`.env` op de server**

   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_URL=https://jouwdomein.nl`
   - Geldige MySQL-credentials
   - `APP_KEY` (kopieer van gegenereerde key of `php artisan key:generate` eenmalig op de server)

3. **Laravel**

   ```bash
   php artisan migrate --force
   php artisan storage:link
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

4. **Webserver**

   - Document root wijst naar `public/`, niet naar de projectmap.
   - HTTPS aanbevolen; zet `SESSION_SECURE_COOKIE=true` indien je dat in `.env` gebruikt.

5. **Queue (optioneel maar aanbevolen)**

   De app gebruikt `QUEUE_CONNECTION=database`. Start een worker, bijvoorbeeld via supervisor:

   ```bash
   php artisan queue:work --tries=3
   ```

6. **Scheduler**

   Als je later geplande taken toevoegt, zet een cron:

   ```cron
   * * * * * cd /pad/naar/shiftly && php artisan schedule:run >> /dev/null 2>&1
   ```

7. **Demoseed op productie**

   `php artisan db:seed` alleen draaien als je bewust een demo wilt; niet op een echte productiedatabase met echte gebruikers.

## Controleren

Voer voor een merge of release lokaal uit:

```bash
php artisan test
npx tsc --noEmit
npm run build
```

Optioneel: `vendor/bin/pint` (PHP-stijl), `npm run lint`, `npm run format:check`.

Tests gebruiken SQLite in memory; de draaiende app gebruikt MySQL zoals in `.env`.

## Werkwijze en commits

- Eén logische wijziging per commit (feature, fix of docs).
- Commitberichten in het Nederlands, korte zin met punt, bijvoorbeeld: `Admin bedrijvenlijst toegevoegd.`
- Push naar `main` wanneer een stap af is en getest.
- Geen secrets in git (`.env` blijft lokaal).

## Bouwplan

- [x] Naam, stack en repository kiezen
- [x] Laravel met React en Inertia opzetten
- [x] MySQL-configuratie voorbereiden
- [x] Registreren, inloggen en een afgeschermd dashboard via de startbasis
- [x] Lokale MySQL-verbinding en migraties controleren
- [x] Eigen vormgeving en mobiele navigatie
- [x] Banen met uurloon beheren
- [x] Uren invoeren, wijzigen en verwijderen
- [x] Pauzes en nachtdiensten berekenen
- [x] Dashboard met filters en verdiensten
- [x] In- en uitklokken
- [x] Bedrijven: team, uitnodigingen, goedkeuring en instellingen
- [ ] Screenshots, automatische controles en online demo

## Bronnen

Het idee is gebaseerd op [ED-MBO/vibecheck](https://github.com/ED-MBO/vibecheck). De bestaande applicatiecode wordt niet overgenomen.

De technische basis en authenticatie komen uit de officiële [Laravel React starter kit v1.0.1](https://github.com/laravel/react-starter-kit/tree/v1.0.1), onder de MIT-licentie. De urenregistratie, bedrijfsmodule en eigen vormgeving worden hier stap voor stap bovenop gebouwd.
