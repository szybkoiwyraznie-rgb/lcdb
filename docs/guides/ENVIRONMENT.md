# Środowisko sesji agentowej — ograniczenia, procedury i pułapki (`docs/guides/ENVIRONMENT.md`)

> Dokument trwały opisujący stałe właściwości środowiska sesji agentowych w Arenie dla repozytorium `lcdb`. Reguły odziedziczono z projektów właściciela (`wwm` i `srw`) i zweryfikowano w tym repozytorium **2026-11-25**.

Powiązania: [`AGENTS.md`](../../AGENTS.md), [`ENVIRONMENT.md`](../../ENVIRONMENT.md), [ADR 0001](../decisions/0001-powloka-i-drzewo-danych.md), [ADR 0014](../decisions/0014-sesja-galaz-pr-i-audyt.md), [`docs/LESSONS.md`](../LESSONS.md).

---

## 1. Izolacja sesji — co naprawdę przetrwa

Każda nowa sesja startuje z czystego klona i widzi wyłącznie:

1. **gałąź `main` na GitHubie** (stan po scaleniu wcześniejszych PR-ów przez właściciela),
2. **tekst wiadomości właściciela** (oraz ewentualnie włączone konektory, np. `google_drive`),
3. **to, co sama wypchnie na swoją gałąź `arena/<id>`**.

**Nie przetrwa nic poza repozytorium:** zawartość `/tmp`, pliki z `google_drive/`, uruchomione procesy tła, niewypchnięte commity, pamięć czatu poprzedniej sesji. Stąd dwie konsekwencje:

- **Praca istnieje dopiero po `git push`.** Commituj i wypychaj po każdym zielonym kroku; nigdy nie odkładaj pierwszego pushu na sam koniec sesji.
- **Wszelką wiedzę trwałą zapisuj w repozytorium** (karty `content/`, archiwa `rozgrywka/`, `docs/decisions/`, `docs/LESSONS.md`, `docs/audits/`).

---

## 2. Koniec dostępu: scalenie lub zamknięcie PR = koniec pracy sesji

Sesja jest powiązana z jedną gałęzią `arena/<id>` i jednym Pull Requestem do `main`:

- Gdy właściciel **scali** lub **zamknie** ten PR, sesja kończy zadanie — nie wolno otwierać kolejnego PR-a ani tworzyć nowej gałęzi.
- **Agent NIGDY sam nie scala (`gh pr merge`) i nigdy sam nie zamyka (`gh pr close`) PR-a**, nawet po akceptacji treści przez właściciela. Gdy właściciel pyta „czy to już widać na stronie?”, wskaż mu podgląd na żywo z sesji oraz otwarty PR gotowy do scalenia po jego stronie.
- Nie zostawiaj żadnych porządków „na po scaleniu” — opis PR-a, audyt i bramy muszą być domknięte przed oddaniem głosu.

---

## 3. Odzyskiwanie po resecie kontenera w trakcie sesji

Zdarza się, że kontener w trakcie sesji zostanie odtworzony: lokalny `HEAD` wraca na `main` lub pierwotny commit, `/tmp` pustoszeje, a `git push` odrzuca zmiany jako *non-fast-forward*.

**Jeśli wcześniejsze kroki były wypychane, praca jest bezpieczna na `origin`:**

```bash
git rev-parse --abbrev-ref HEAD
git status --short
git ls-remote --heads origin
git fetch origin <gałąź-sesji> --unshallow || git fetch origin <gałąź-sesji>
```

- Gdy drzewo robocze jest czyste: `git reset --hard FETCH_HEAD`.
- Gdy w drzewie roboczym są niezacommitowane zmiany z ostatniej chwili: `git reset --mixed FETCH_HEAD` (przesuwa wskaźnik gałęzi i indeks na zdalną historię, zachowując bieżące pliki robocze), po czym zweryfikuj `git diff`, uruchom bramy i wykonaj zwykły commit + push.
- **Nigdy nie używaj `git push --force`.**

---

## 4. Git, GitHub CLI i płytki klon (pomiar 2026-11-25)

1. **Płytki klon (`shallow`):** na starcie sesji `git rev-parse --is-shallow-repository` zwraca `true`. Ponieważ `tools/build.mjs` wyznacza daty utworzenia i ostatniej zmiany kart z `git log`, zawsze wykonaj na początku sesji:
   ```bash
   git fetch --unshallow
   ```
   W workflowach `.github/workflows/ci.yml` oraz `.github/workflows/pages.yml` ustawiono `fetch-depth: 0`.
2. **Opisy commitów i PR-ów:** przekazuj je przez pliki w `/tmp` (`git commit -F /tmp/commit_msg.txt`, `gh pr create --body-file /tmp/pr_body.md`, `gh pr edit <nr> --body-file /tmp/pr_body.md`), unikając zagnieżdżonych cudzysłowów i obcinania znaków diakrytycznych.
3. **Odczyt PR-ów przez `gh`:** gołe `gh pr view <nr>` zwraca błąd GraphQL (`Projects (classic) is being deprecated… pullRequest.projectCards`). Zawsze podawaj jawne pola JSON lub używaj REST API:
   ```bash
   gh pr view <nr> --json number,title,state,body,url
   gh api repos/szybkoiwyraznie-rgb/lcdb/pulls/<nr>
   ```
4. **Wygasły token GitHuba:** gdyby `git push` lub `gh` zwróciły błąd uwierzytelnienia, zachowaj commity lokalnie i poproś właściciela o odświeżenie połączenia GitHub w Arenie. Nigdy nie proś o tokeny, hasła ani kody 2FA w rozmowie.

---

## 5. Artefakt witryny i stały podgląd na żywo (`Live Preview`)

1. **Dwa tryby budowania (`tools/build.mjs`):**
   - `npm run build` (domyślny, produkcyjny na GitHub Pages i dla serwera podglądu): tworzy lekką powłokę `dist/index.html` ze spakowanym gzip+base64 indeksem (`LCDB_B64`) oraz katalog `dist/data/` z osobno dociąganymi ciałami kart (`<slug>.json`), indeksem pełnotekstowym (`teksty.json`) i dziennikiem (`co-nowego.json`).
   - `npm run build:single`: tworzy pojedynczy samowystarczalny plik `dist/index.html` z pełnym obiektem `LCDB_DATA` do otwarcia z `file://` bez serwera. Po testach trybu `--single` zawsze przywróć standardowy build (`npm run build`), żeby podgląd i CI widziały `dist/data/`.
2. **Serwer podglądu (`tools/serve.mjs`):**
   - Uruchamiany wyłącznie przez narzędzie `start_process` (`command: "npm run serve"`, `name: "Kronika Limbus Company"`), a nie przez jednorazowy `bash`.
   - Wiąże adres `0.0.0.0:3000` (nigdy `127.0.0.1`), nie blokuje obcych nagłówków `Host` / `Origin` (wymóg proxy `https://3000-<sandboxId>.e2b.app`) i dla nieistniejących ścieżek `/data/*` zwraca jawny kod `404` zamiast powłoki HTML.
   - Ponieważ serwer czyta pliki z `dist/` na bieżąco przy każdym żądaniu, po zmianie treści wystarczy uruchomić `npm run build` — nie trzeba restartować procesu serwera.

---

## 6. Dostawy przez Google Drive i katalog `google_drive/`

1. Gdy właściciel włączy konektor `google_drive` i wskaże pliki dostawy, najpierw wywołaj `list_connector_tools` z `service: "google_drive"`, a potem `call_connector_tool` (`search_files` / `list_files` / `download_file`).
2. Pobrane pliki zapisuj w katalogu `google_drive/` wewnątrz repozytorium — katalog ten jest wykluczony w `.gitignore` i nie wchodzi do migawek Gita.
3. **Ochrona granicy fabuły przy dużych paczkach:** na Dysku mogą leżeć archiwa obejmujące wiele rozdziałów lub narzędzia tłumaczeniowe właściciela. Wolno Ci wyciąć do `rozgrywka/zapisy/<RRRR-MM-DD>-<nr>.md` i opracować w `content/` **wyłącznie** ten zakres scen, który właściciel wskazał jako już rozegrany. Podglądanie dalszych plików z ciekawości jest zakazane — psuje czystość wnioskowania i grozi przemyceniem spoilera.

---

## 7. Dostęp sieciowy i kwerenda zewnętrzna

- Z poziomu powłoki `bash` ruch wyjściowy jest ograniczony do hostów `github.com`, `codeload.github.com`, `api.github.com`, `registry.npmjs.org`, `pypi.org` oraz `files.pythonhosted.org` (`curl` na zewnętrzne strony encyklopedyczne nie zadziała).
- Do weryfikacji źródeł zewnętrznych w blokach `{{kwerenda` używaj dedykowanych narzędzi agenta: `web_search` oraz `fetch_page`, zapisując w dyrektywie `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}` wyłącznie strony faktycznie odczytane w bieżącej sesji.
