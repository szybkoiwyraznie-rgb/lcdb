# Środowisko uruchomieniowe — skrót startowy (`ENVIRONMENT.md`)

Ten plik jest szybką ściągawką właściwości środowiska sesji agentowej w Arenie dla repozytorium `lcdb`. Pełny opis procedur ratunkowych i pomiarów znajduje się w [`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md).

## Najważniejsze fakty

1. **Środowisko wykonawcze:** Linux w izolowanym kontenerze, Node.js ≥ 22 (`"type": "module"`), `git`, `gh` (uwierzytelniony jako konto właściciela). Projekt ma **zero zależności npm** — nigdy nie uruchamiaj `npm install`.
2. **Płytki klon na starcie:** świeża sesja często startuje z `is-shallow-repository = true`. Zaraz po starcie wykonaj `git fetch --unshallow`, żeby daty zmian w stopce kart (`git log` w `tools/build.mjs`) były kompletne.
3. **Jedna gałąź, jeden PR:** pracuj wyłącznie na gałęzi sesji podanej w komunikacie systemowym (`arena/…`). Praca istnieje dopiero po `git push origin <gałąź-sesji>`. **Nigdy nie scalaj ani nie zamykaj PR-a samemu** — scalenie lub zamknięcie PR-a kończy pracę sesji.
4. **Podgląd na żywo (`Live Preview`):** uruchamiaj `npm run serve` wyłącznie przez `start_process` (nie przez jednorazowy `bash`). Serwer słucha na `0.0.0.0:3000`, przyjmuje dowolny nagłówek `Host` proxy (`https://3000-….e2b.app`) i dla brakujących plików `/data/*` zwraca jawny kod `404`.
5. **Konektor Google Drive i katalog `google_drive/`:** właściciel może przekazywać paczki danych przez Google Drive (`list_connector_tools` → `call_connector_tool` dla `google_drive`). Pobrane archiwa trzymaj roboczo w `google_drive/` (wykluczonym w `.gitignore`) i przenoś do `rozgrywka/zapisy/` **wyłącznie** rozegrany odcinek wskazany przez właściciela.
6. **Pułapka `gh pr view`:** klasyczne wywołanie `gh pr view <nr>` potrafi zwrócić błąd GraphQL o wycofanym `projectCards`. Używaj `gh pr view <nr> --json number,title,state,body,url` albo `gh api repos/szybkoiwyraznie-rgb/lcdb/pulls/<nr>`.
7. **Sieć wyjściowa w powłoce:** procesy w `bash` mają dostęp wyłącznie do `github.com`, `api.github.com`, `codeload.github.com`, `registry.npmjs.org`, `pypi.org` i `files.pythonhosted.org`. Do kwerendy zewnętrznych źródeł literackich i kulturowych używaj narzędzi `web_search` oraz `fetch_page`.

Szczegółowe procedury (w tym odzyskiwanie pracy po resecie kontenera) → [`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md).
