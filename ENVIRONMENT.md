# Środowisko wykonawcze (`ENVIRONMENT.md`)

Skrócona ściąga techniczna dla sesji pracujących w repozytorium `lcdb`. Szersze uzasadnienie architektoniczne znajduje się w [`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md).

---

## Wymagania

| Element | Wymaganie | Uwagi |
|---|---|---|
| Node.js | `>= 22` | Natywne ESM, `node:test`, `node:zlib`, globalne `fetch` / `Response` / `DecompressionStream` |
| Zależności npm | **brak (`0`)** | Nie uruchamiaj `npm install <pakiet>`; całość działa na bibliotece standardowej Node.js (ADR 0002) |
| Git | pełna historia (`fetch-depth: 0`) | Jeśli `git rev-parse --is-shallow-repository` zwraca `true`, uruchom `git fetch --unshallow` |
| Kodowanie i końce linii | UTF-8, `LF` | Wymuszane przez `.editorconfig` i `.gitattributes` |

---

## Komendy projektu

```bash
npm test                                           # Uruchamia równolegle wszystkie zestawy test/*.test.js
npm run zapis                                      # Sprawdza dosłowność :::zapis i pokrycie rozgrywka/zapisy/
npm run build                                      # Buduje powłokę dist/index.html + dist/data/*.json
npm run build:single -- --out dist/jeden-plik.html # Buduje jednoplikowe archiwum offline (tryb calosc)
npm run serve                                      # Serwuje dist/ na http://0.0.0.0:3000 (skrót: npm start)
```

---

## Serwer podglądu na żywo (`Live Preview`)

- Komenda `npm run serve` uruchamia `tools/serve.mjs` związany z adresem `0.0.0.0` na porcie `3000` (lub `PORT` ze zmiennej środowiskowej).
- Uruchamiaj go na początku sesji przez `start_process` (nigdy przez jednorazowy `bash`, który ubija proces po upływie limitu czasu).
- Serwer nie przebudowuje plików samoczynnie w locie: po zmianach w `content/`, `rozgrywka/` lub `src/lcdb/` wywołaj `npm run build` — działający serwer od razu poda świeże pliki z `dist/` z nagłówkiem `Cache-Control: no-cache`.
- Żądania do nieistniejących plików w `/data/*.json` celowo zwracają `404` (a nie powłokę HTML), aby brak buildu lub brakująca karta były widoczne natychmiast (ADR 0001).

---

## CI i publikacja GitHub Pages

- **`.github/workflows/ci.yml`** uruchamia się dla każdego wypchnięcia gałęzi roboczej oraz dla każdego PR-a: pobiera pełną historię Gita (`fetch-depth: 0`), odpala `npm test`, `npm run zapis`, `npm run build` oraz kontrolny build jednoplikowy `npm run build:single`.
- **`.github/workflows/pages.yml`** uruchamia się po scaleniu PR-a do `main` (lub ręcznie przez `workflow_dispatch`): po przejściu wszystkich bram publikuje katalog `dist/` (`index.html` + `data/*.json`) na GitHub Pages przy użyciu `actions/configure-pages@v5` (`enablement: true`), `actions/upload-pages-artifact@v3` i `actions/deploy-pages@v4`.
- Jeśli w ustawieniach nowego repozytorium GitHub Pages nie było jeszcze nigdy włączone, właściciel jednorazowo wybiera w **Settings → Pages → Build and deployment → Source: GitHub Actions** (token sesji agenta nie ma uprawnień administracyjnych `administration:write` do zmiany ustawień repozytorium).

---

## Ochrona gałęzi `main` (ruleset właściciela)

Wzorem repozytoriów `wwm` i `srw`, gałąź `main` powinna być chroniona aktywnym rulesetem GitHub (**Settings → Rules → Rulesets → New branch ruleset**):

- **Ruleset Name:** `main`, **Enforcement status:** `Active`, **Target:** `Default branch` (`~DEFAULT_BRANCH`), **Bypass list:** pusta.
- **Rules:**
  - *Restrict deletions*
  - *Block force pushes* (`non_fast_forward`)
  - *Require a pull request before merging*:
    - *Required approvals:* `0` (właściciel sam przegląda i scala PR-y sesji)
    - *Require conversation resolution before merging:* włączone
    - *Allowed merge methods:* wyłącznie **Squash** (`squash`)
  - *Require status checks to pass:* `Testy i build` (z workflowu `CI`).

*(Token sesji agenta ma uprawnienia do kodu i PR-ów, lecz zwraca `403` dla endpointu administracyjnego `/rulesets` — powyższą konfigurację właściciel włącza jednorazowo w panelu GitHub lub własnym tokenem właścicielskim).*

---

## Odzyskiwanie po typowych usterkach

- **Brak dat aktualizacji kart w stopce / powłoce:** repozytorium jest płytkim klonem (`shallow`). Wykonaj `git fetch --unshallow && npm run build`.
- **Podgląd pokazuje starą wersję po edycji plików `.md`:** uruchom `npm run build` — `serve.mjs` czyta pliki z `dist/` przy każdym żądaniu.
- **Błąd `404` na `data/<slug>.json` w przeglądarce:** dodano nową kartę w `content/`, ale nie przebudowano `dist/data/` — uruchom `npm run build`.
