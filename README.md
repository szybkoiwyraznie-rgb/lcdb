# Limbus Company — kronika opowieści (`lcdb`)

Fabułocentryczna, bezspoilerowa kronika podróży przez świat **Limbus Company** — prowadzona scena po scenie, wyłącznie do miejsca, w którym aktualnie stoi opowiedziana historia.

Projekt wyrasta ze wspólnego wzorca wypracowanego w repozytoriach [`wwm`](https://github.com/szybkoiwyraznie-rgb/wwm) oraz [`srw`](https://github.com/szybkoiwyraznie-rgb/srw): zero zależności zewnętrznych, czytelny markdown z jawnym pochodzeniem każdego twierdzenia, automatyczne bramy integralności oraz zdyscyplinowany przepływ pracy kolejnych sesji agentów.

---

## Sześć filarów kroniki

1. **Fabuła przed mechaniką (*fabuła first*).** Jednostkami kroniki są rozdziały (Prolog, Pieśni / *Canto*, Interludia / *Intervallo*, krótkie opowieści), epizody, sceny, wątki, postacie, frakcje Miasta, dzielnice, miejsca, konteksty literackie oraz pojęcia świata — nigdy ekrany gry, banery gacha ani tabelki przeliczników walki (ADR 0004, 0013).
2. **Kronika nie mówi o sobie samej.** Widoczna treść kart opowiada wyłącznie o świecie przedstawionym i wydarzeniach. Słownictwo warsztatowe („baza”, „wpis”, „dostawa”, „agent”, „plik”, „repozytorium”) i żargon mechaniczny („gracz”, „gameplay”, „baner”, „uptie”) są blokowane automatycznie przez `test/jezyk.test.js` (ADR 0012).
3. **Jawne pochodzenie każdej warstwy informacji.** Wewnątrz każdego boksu `##` warstwy niosą jeden z czterech kolorów pochodzenia: `{{dostawa}}` (dosłowne słowa z opowieści), `{{opracowanie}}` (streszczenie i wnioski wprost ze scen), `{{kwerenda}}` (twierdzenie opatrzone obowiązkowym przypisem `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`) oraz `{{model}}` (ogólne tło literackie i filozoficzne) — ADR 0005.
4. **Hipotezy z miarą pewności — bez prorokowania.** Odczytania tego, czego fabuła jeszcze nie rozstrzygnęła, zapisywane są w fioletowej warstwie `{{model pewnosc=0–100 pytanie="…"}}` i zbierane w widoku `#/hipotezy`. Wiedza spoza rozegranych scen (z przyszłych Pieśni, wiki lub zakończeń pierwowzorów literackich) nie może być przemycana pod postacią „trafnych przypuszczeń” (ADR 0006).
5. **Ślad wcześniejszych interpretacji.** Gdy nowa scena obala, zawęża albo przesuwa wcześniejszy wniosek, dawna treść nie znika po cichu: trafia dosłownie do pola `interpretacje:` we frontmatterze i wyświetla się pod właściwą sekcją jako zwijana *Poprzednia wersja* (ADR 0007).
6. **Twarda granica opowiedzianej historii.** Plik `rozgrywka/postep.json` (`ostatnia_scena`) wyznacza nieprzekraczalny próg poznanej fabuły. Build odrzuca każdą scenę za granicą, a dosłowność bloków `:::zapis` jest porównywana z nietykalnym archiwum `rozgrywka/zapisy/` (ADR 0008, 0009).

---

## Szybki start

Wymagany jest wyłącznie **Node.js ≥ 22** (brak `npm install` — projekt nie używa żadnych paczek z npm).

```bash
npm test            # Wszystkie bramy: silnik, integralność, język, trasy, ładowanie, dokumentacja
npm run zapis       # Kontrola dosłowności bloków :::zapis względem rozgrywka/zapisy/
npm run build       # Build powłoki dist/index.html + dist/data/*.json (publikacja Pages)
npm run build:single # Jednoplikowe archiwum offline
npm run serve       # Serwer podglądu na http://0.0.0.0:3000
```

---

## Mapa repozytorium

```text
AGENTS.md                 Instrukcja startowa i rytuał sesji dla każdego kolejnego agenta
ENVIRONMENT.md            Środowisko wykonawcze, komendy, podgląd na żywo, CI/Pages, ruleset
rozgrywka/
  postep.json             Twarda granica rozegranej fabuły (ostatnia_scena)
  zapisy/                 Nietykalne archiwum zapisów poznanych scen (.md)
content/
  co-nowego.md            Dziennik kolejnych odsłon podróży
  rozdzialy/              Prolog, Pieśni (Canto), Interludia (Intervallo), krótkie opowieści
  epizody/                Zamknięte etapy wewnątrz rozdziałów
  sceny/                  Pojedyncze wydarzenia z dosłownym :::zapis i analizą
  watki/                  Nici fabularne, pytania i tajemnice biegnące przez rozdziały
  postacie/               Grzesznicy, przewodnicy, Fixerzy i mieszkańcy Miasta
  frakcje/                Skrzydła Miasta, stowarzyszenia, biura, warsztaty i syndykaty
  dzielnice/              Dzielnice Miasta (1–26), Gniazda, Zaułki, Obrzeża, Ruiny
  miejsca/                Konkretne miejsca poznane na trasie podróży
  konteksty/              Pierwowzory literackie, mitologiczne, filozoficzne i religijne
  pojecia/                Anomalie, E.G.O, osobliwości, światy lustrzane, prawa Miasta
src/lcdb/                 Czysty silnik ESM, parsery, rejestr walidacji, widoki SPA i style
tools/                    Skrypty buildu, ładowania treści, serwera podglądu i kontroli zapisu
test/                     Automatyczne bramy jakości uruchamiane w Node (node:test)
docs/
  LESSONS.md              Sprawdzone lekcje i pułapki z pracy nad kroniką
  decisions/              Rejestr decyzji architektonicznych (ADR 0001–0016)
  guides/                 Przewodniki: SCHEMAT_DANYCH.md, PRZEPLYW_SCENY.md, ENVIRONMENT.md
  audits/                 Zapisy audytów wcześniejszych PR-ów (gdy wykryto usterki)
  plans/                  Plany większych prac wieloetapowych
```

---

## Dokumentacja

- **Dla agenta rozpoczynającego sesję:** zacznij od [`AGENTS.md`](AGENTS.md).
- **Środowisko, podgląd i GitHub:** [`ENVIRONMENT.md`](ENVIRONMENT.md) oraz [`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md).
- **Pełny schemat typów, pól i kolorów pochodzenia:** [`docs/guides/SCHEMAT_DANYCH.md`](docs/guides/SCHEMAT_DANYCH.md).
- **Obróbka nowej dostawy rozgrywki krok po kroku:** [`docs/guides/PRZEPLYW_SCENY.md`](docs/guides/PRZEPLYW_SCENY.md).
- **Rejestr decyzji architektonicznych (ADR):** [`docs/decisions/README.md`](docs/decisions/README.md).
- **Zebrane doświadczenia i pułapki:** [`docs/LESSONS.md`](docs/LESSONS.md).
