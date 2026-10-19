# Shiftly

Een urenregistratie-app die ik stap voor stap bouw voor mijn portfolio.

## Stack

Laravel 12, Inertia 2, React 19, TypeScript, Tailwind CSS 4 en MySQL.

## Installeren

Vereist: PHP 8.2+, Composer, Node.js 22 en MySQL.

1. Voer `composer install` en `npm install` uit.
2. Kopieer `.env.example` naar `.env` en vul je MySQL-gegevens in.
3. Maak een lege MySQL-database `shiftly`.
4. Voer `php artisan key:generate` en `php artisan migrate` uit.
5. Start `composer run dev` en open http://localhost:8000.

## Controleren

- `php artisan test`
- `npx tsc --noEmit`
- `npm run build`

Tests gebruiken een tijdelijke SQLite-database in het geheugen. De applicatie gebruikt MySQL.

## Bouwplan

- [x] Naam, stack en repository kiezen
- [x] Laravel met React en Inertia opzetten
- [x] MySQL-configuratie voorbereiden
- [x] Registreren, inloggen en een afgeschermd dashboard via de startbasis
- [ ] Lokale MySQL-verbinding en migraties controleren
- [ ] Eigen vormgeving en mobiele navigatie
- [ ] Banen met uurloon beheren
- [ ] Uren invoeren, wijzigen en verwijderen
- [ ] Pauzes en nachtdiensten berekenen
- [ ] Dashboard met filters en verdiensten
- [ ] In- en uitklokken
- [ ] Screenshots, automatische controles en online demo

We bouwen één onderdeel per sessie en maken commits voor afgeronde wijzigingen op de werkelijke werkdatum.

## Bronnen

Het idee is gebaseerd op [ED-MBO/vibecheck](https://github.com/ED-MBO/vibecheck). De bestaande applicatiecode wordt niet overgenomen.

De technische basis en authenticatie komen uit de officiële [Laravel React starter kit v1.0.1](https://github.com/laravel/react-starter-kit/tree/v1.0.1), onder de MIT-licentie. De urenregistratie en eigen vormgeving worden hier stap voor stap bovenop gebouwd.
