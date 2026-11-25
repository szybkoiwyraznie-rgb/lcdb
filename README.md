# Limbus Company — kronika opowieści (`lcdb`)

Polskojęzyczna kronika i baza powiązań opowieści **Limbus Company**, budowana przyrostowo przez kolejne sesje agentowe równolegle z rozgrywką właściciela. Architektura techniczna, sposób obróbki dostaw, organizacja sesji oraz zestaw bram jakości wywodzą się bezpośrednio z siostrzanych repozytoriów [`wwm`](https://github.com/szybkoiwyraznie-rgb/wwm) i [`srw`](https://github.com/szybkoiwyraznie-rgb/srw).

> **Dla agenta rozpoczynającego sesję:** zacznij od lektury [`AGENTS.md`](AGENTS.md) oraz [`ENVIRONMENT.md`](ENVIRONMENT.md).

## Najważniejsze zasady kroniki

1. **Fabuła przed mechaniką** ([ADR 0004](docs/decisions/0004-opowiesc-przed-mechanika.md)) — strukturę tworzą rozdziały (Prolog, *Canto*, *Intervalla*), epizody, sceny, wątki, postacie, organizacje Miasta, dzielnice, miejsca, hasła świata oraz konteksty literacko-kulturowe. Mechanika bitewna, przeliczniki monet i system losowań nie mają własnych kart; akta postaci, opowieści ze Światów Lustrzanych, dzienniki Abominacji i *Zapiski Dantego* wchodzą do kroniki jako materiał o świecie ([ADR 0016](docs/decisions/0016-akta-lustra-i-zapiski-to-lore.md)).
2. **Zero języka meta w widocznej treści** ([ADR 0012](docs/decisions/0012-kronika-nie-mowi-o-sobie.md)) — karty mówią o osobach, miejscach i zdarzeniach Miasta, nigdy o „wpisach w bazie”, „dostawach”, „sekcjach” ani „ekranie wyboru”. Reguły pilnuje mechanicznie `test/jezyk.test.js`.
3. **Jawne rozróżnienie pochodzenia danych** ([ADR 0005](docs/decisions/0005-jeden-boks-wiele-warstw.md)) — każdy akapit leży w jednej z czterech warstw: `dostawa` (*z opowieści*), `opracowanie` (*opracowanie*), `kwerenda` (*źródła sprawdzone* z pełnym adresem URL i datą odczytu) albo `model` (*wiedza modelu*).
4. **Hipotezy z pewnością i historią interpretacji** ([ADR 0006](docs/decisions/0006-hipotezy-z-pewnoscia.md), [ADR 0007](docs/decisions/0007-historia-interpretacji.md)) — domysły są oznaczane jako `{{model pewnosc=0..100 pytanie="…"}}` (fioletowa warstwa), a gdy późniejsza scena zmienia odczytanie, dawna wersja zostaje zachowana w polu `interpretacje:` i wyświetla się w boksie jako zwijane *Wcześniejsze odczytanie*.
5. **Niewyprzedzanie fabuły** ([ADR 0008](docs/decisions/0008-granica-fabuly.md)) — `rozgrywka/postep.json` wyznacza ostatnią rozegraną scenę. Żadna karta, żaden kontekst literacki i żadna hipoteza nie może zdradzać wydarzeń spoza tej granicy (zakazane są także pozorowane hipotezy przemycające wiedzę modelu o dalszych Pieśniach).

## Szybki start

Wymagany wyłącznie **Node.js ≥ 22** (zero zależności `npm` — [ADR 0002](docs/decisions/0002-zero-zaleznosci-i-wlasny-markdown.md)):

```bash
npm test              # testy silnika, integralności, języka, tras, ładowania i dokumentacji
npm run zapis         # kontrola dosłowności bloków :::zapis względem rozgrywka/zapisy/
npm run build         # buduje powłokę dist/index.html + drzewo danych dist/data/*.json
npm run build:single  # buduje pojedynczy samowystarczalny plik dist/index.html (offline / file://)
npm run serve         # uruchamia lokalny serwer podglądu na http://0.0.0.0:3000/
```

## Układ repozytorium

| Ścieżka | Przeznaczenie |
|---|---|
| `AGENTS.md` | Instrukcja startowa i kontrakt pracy każdej sesji agentowej |
| `ENVIRONMENT.md` | Skrót właściwości i ograniczeń środowiska uruchomieniowego |
| `content/` | Karty kroniki w 10 katalogach typów oraz dziennik `content/co-nowego.md` |
| `rozgrywka/` | Granica postępu `rozgrywka/postep.json` i niemodyfikowalne archiwa `rozgrywka/zapisy/` |
| `src/lcdb/` | Silnik SPA, parsery, walidatory schematu, widoki i arkusz stylów |
| `tools/` | Skrypty budowania (`build.mjs`), serwera (`serve.mjs`), testów i weryfikacji zapisów |
| `test/` | Sześć zestawów bram automatycznych (`node:test`) |
| `docs/guides/` | Przewodniki: schemat danych, przepływ dostawy sceny, środowisko sesji |
| `docs/decisions/` | Rejestr decyzji architektonicznych (ADR `0001`–`0016`) |
| `docs/LESSONS.md` | Skondensowane lekcje z pracy nad kroniką |
| `docs/audits/` | Zapisy trójczęściowych audytów poprzednich scalonych PR-ów |
| `docs/plans/` | Plany większych prac wielosesyjnych |
| `.github/workflows/` | Bramy CI (`ci.yml`) oraz automatyczna publikacja na GitHub Pages (`pages.yml`) |

## Publikacja

Po scaleniu zmian do gałęzi `main` workflow `.github/workflows/pages.yml` uruchamia pełny zestaw testów, buduje powłokę z drzewem danych `dist/data/` i publikuje witrynę na GitHub Pages. Artefakt `dist/` jest wykluczony z Gita — źródłem prawdy pozostają pliki Markdown w `content/` oraz `rozgrywka/`.
