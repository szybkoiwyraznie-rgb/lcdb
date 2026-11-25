# Dlaczego środowisko działa w ten sposób (`docs/guides/ENVIRONMENT.md`)

Ten przewodnik wyjaśnia przyczyny architektonicznych wyborów środowiska `lcdb` opisanych skrótowo w [`ENVIRONMENT.md`](../../ENVIRONMENT.md).

---

## 1. Zero zależności zewnętrznych (ADR 0002)

Kronika powstaje przez wiele kolejnych sesji agentów na przestrzeni długiego grania w *Limbus Company*. Zewnętrzne paczki npm starzeją się, wymagają `npm install` przy zimnym starcie sandboksa, generują ostrzeżenia bezpieczeństwa i potrafią zmienić zachowanie parsera markdownu między wersjami.

Oparcie całości o czysty **Node.js ≥ 22** oznacza:
- natychmiastowy start sesji (`npm test` i `npm run build` działają w ułamku sekundy od sklonowania repozytorium),
- stuprocentową przewidywalność parsera frontmattera (`src/lcdb/frontmatter.js`) i markdownu (`src/lcdb/markdown.js`),
- brak ukrytych mutacji danych — każda nieobsługiwana składnia kończy się czytelnym błędem buildu.

---

## 2. Powłoka `dist/index.html` + leniwe `dist/data/*.json` (ADR 0001)

W miarę dopisywania kolejnych Pieśni (*Canto*), Interludiów, kart Grzeszników, Frakcji i Anomalii łączna objętość tekstów przekroczy wiele megabajtów.

Dlatego domyślny `npm run build` dzieli artefakt na dwie warstwy:
1. **`dist/index.html`** — lekka powłoka zawierająca style, sklejony kod SPA oraz skompresowany strumieniem `deflate-raw` (Base64) indeks metadanych wszystkich kart (tytuły, relacje, tagi, hipotezy, statystyki). Dzięki temu strona główna, chronologia, listy działów i filtry otwierają się natychmiast bez dodatkowych zapytań sieciowych.
2. **`dist/data/<slug>.json`, `teksty.json`, `co-nowego.json`** — wyrenderowane ciała poszczególnych kart i indeks pełnotekstowy wyszukiwarki, pobierane przez przeglądarkę dopiero wtedy, gdy czytelnik wejdzie na daną kartę lub otworzy `#/szukaj`.

Dla potrzeb trwałej kopii zapasowej zachowano również tryb **`npm run build:single`**, który osadza wszystkie ciała wewnątrz jednego samodzielnego pliku HTML działającego bez serwera HTTP.

---

## 3. Serwer podglądu na `0.0.0.0:3000` i twarde `404` dla `/data/`

- Środowisko podglądu na żywo przekierowuje ruch z przeglądarki właściciela przez proxy `https://{port}-{sandboxId}.e2b.app` do portu nasłuchującego na `0.0.0.0` wewnątrz sandboksa. Powiązanie z `127.0.0.1` odcięłoby podgląd.
- Kod przeglądarkowy w `src/lcdb/ladowanie.js` pobiera dane wyłącznie **ścieżkami względnymi** (`data/<slug>.json`), dzięki czemu działa identycznie pod proxy `e2b.app`, na `localhost:3000` oraz w podkatalogu GitHub Pages (`/lcdb/`).
- Dla nieistniejących ścieżek spoza `/data/` serwer zwraca `index.html`, natomiast brakujący plik w `/data/` zwraca `404` w czystym tekście — inaczej `response.json()` próbowałoby parsować powłokę HTML i maskowało przyczynę usterki.

---

## 4. Daty z historii Gita i pełny klon (`fetch-depth: 0`)

Kronika nie zaśmieca frontmattera ręcznie przepisywanym polem `zaktualizowano:` przy każdej drobnej poprawce. Zamiast tego `tools/content-loader.mjs` odczytuje czas ostatniego commita dotykającego każdego pliku z `git log` w strefie UTC. Aby daty były prawdziwe zarówno lokalnie, jak i na GitHub Pages, workflowy CI/Pages używają `fetch-depth: 0`, a sesja agenta w razie płytkiego klonu wykonuje `git fetch --unshallow`.
