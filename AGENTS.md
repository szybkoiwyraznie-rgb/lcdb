# Instrukcja pracy agenta (`AGENTS.md`)

Ten plik jest **jedynym punktem wejścia** każdej sesji w repozytorium `lcdb`. Zanim dotkniesz jakiegokolwiek pliku w `content/`, `rozgrywka/`, `src/` czy `tools/`, wykonaj poniższe kroki w podanej kolejności.

Cała komunikacja z właścicielem, opisy commitów, tytuły i opisy PR-ów, komentarze w kodzie oraz treść kroniki powstają **wyłącznie po polsku**.

---

## Krok 0 — Uruchom stały podgląd na żywo (`0.0.0.0:3000`)

Zanim zaczniesz analizę lub edycję, zbuduj aktualny stan i uruchom serwer podglądu w tle narzędziem procesów długożyjących (`start_process`, z czytelną nazwą po polsku, np. `Kronika Limbus Company`, komenda `npm run serve`):

1. Serwer nasłuchuje na `0.0.0.0:3000` i wystawia właścicielowi **Live Preview** w przeglądarce.
2. Proces podglądu **musi działać nieprzerwanie do końca sesji** — nie zatrzymuj go przed zakończeniem odpowiedzi.
3. Po każdej zmianie w `content/`, `rozgrywka/` lub `src/lcdb/` uruchom `npm run build`, aby odświeżyć `dist/index.html` i `dist/data/*.json` serwowane przez działający proces.

---

## Krok 1 — Obowiązkowa lektura startowa

Przeczytaj w całości:

1. [`README.md`](README.md) — sześć filarów kroniki i mapa katalogów.
2. [`ENVIRONMENT.md`](ENVIRONMENT.md) — wymagania środowiska, pełny klon Gita, komendy i ochrona `main`.
3. [`docs/LESSONS.md`](docs/LESSONS.md) — błędy, które już raz bolały i których nie wolno powtórzyć.
4. [`docs/decisions/README.md`](docs/decisions/README.md) — spis wszystkich obowiązujących decyzji ADR (oraz pełną treść tych ADR-ów, których dotyka twoje zadanie).
5. Przy pracy z treścią opowieści: [`docs/guides/SCHEMAT_DANYCH.md`](docs/guides/SCHEMAT_DANYCH.md) oraz [`docs/guides/PRZEPLYW_SCENY.md`](docs/guides/PRZEPLYW_SCENY.md).

---

## Krok 2 — Sprawdzenie stanu repozytorium i gałęzi

Uruchom kontrolę wyjściową:

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --is-shallow-repository
git status --short
gh pr list --state all --limit 5
npm test
npm run zapis
npm run build
```

- Jeśli `git rev-parse --is-shallow-repository` zwróci `true`, natychmiast dociągnij pełną historię: `git fetch --unshallow` (build czerpie daty aktualizacji kart z historii Gita — ADR 0001).
- Pracujesz **wyłącznie na bieżącej gałęzi sesji** wskazanej przez platformę. Nigdy nie przełączaj gałęzi, nie twórz pobocznych gałęzi i nie zmieniaj jej nazwy (`1 sesja = 1 gałąź = 1 PR` — ADR 0015).

---

## Krok 3 — Trzyczęściowy audyt poprzedniego scalonego PR-a

Sprawdź ostatni scalony PR na `main` (`gh pr list --state merged --limit 1` oraz `gh pr view <nr> --json files,body,commits` i `git show <commit>`). Przeprowadź audyt w trzech płaszczyznach:

- **(3a) Audyt merytoryczny:** czy poprzednia sesja nie przekroczyła granicy rozegranej fabuły (`rozgrywka/postep.json`), czy bloki `:::zapis` są dosłowne, czy nie przemycono „proroczych hipotez” z wiedzy o przyszłych Pieśniach (*Canto*), czy zrewidowane hipotezy zachowały `interpretacje:`, czy nie wyciekł język meta/mechaniczny.
- **(3b) Audyt kodu i testów:** czy nie dodano zależności zewnętrznych, czy nowe reguły mają pokrycie w `test/*.test.js`, czy nie ma martwych funkcji lub rozjazdu między walidacją a rendererem.
- **(3c) Audyt pozostałych zmian:** czy dokumentacja (`SCHEMAT_DANYCH.md`, `LESSONS.md`, ADR-y) nadąża za kodem, czy do Gita nie trafiły pliki tymczasowe (`dist/`, paczki `.zip`, `google_drive/`).

Wynik wszystkich trzech punktów (`3a`, `3b`, `3c`) wpisz zwięźle do opisu bieżącego PR-a. Jeśli znajdziesz realne usterki:
- drobne napraw od razu w osobnym commicie naprawczym na początku swojej sesji,
- większe udokumentuj w `docs/audits/RRRR-MM-DD-pr-<nr>.md` i uzgodnij z właścicielem.
Gdy brak wcześniejszych scalonych PR-ów, odnotuj w opisie PR-a: `nie dotyczy — brak wcześniejszych scalonych PR-ów`.

---

## Krok 4 — Otwarcie PR-a sesji z planem pracy

Zanim przejdziesz do właściwej pracy, otwórz PR z bieżącej gałęzi do `main` (jeśli na tej gałęzi jeszcze go nie ma):

1. Jeśli nie masz jeszcze commita z kodem, utwórz pusty commit otwierający:
   `git commit --allow-empty -m "Sesja: plan <krótki opis zadania>"` i wypchnij gałąź: `git push -u origin <bieżąca-gałąź>`.
2. Treść opisu PR-a przygotuj poza drzewem repozytorium (np. `/tmp/pr_body.md`), zawierając: **Cel sesji**, **Plan sesji** (lista kroków `[ ]` / `[x]`) oraz **Audyt poprzedniego scalonego PR-a** (`3a`, `3b`, `3c`).
3. Otwórz PR: `gh pr create --base main --head <bieżąca-gałąź> --title "…" --body-file /tmp/pr_body.md`.

---

## Krok 5 — Pętla wykonawcza (każdy zielony krok = osobny commit i push)

### A. Pętla dostawy fabularnej (szczegóły w [`docs/guides/PRZEPLYW_SCENY.md`](docs/guides/PRZEPLYW_SCENY.md))

1. **Rozpoznaj zakres dostawy.** Ustal dokładnie, które sceny właściciel już rozegrał i wskazał do opracowania. Jeśli pobierasz paczkę z Dysku Google (np. czytanki, zrzut zbieracza `LC_DANE_*.zip`, karty Tożsamości/E.G.O), wypakuj ją **poza repozytorium** (`/tmp/...`) i czytaj wyłącznie pliki odpowiadające rozegranemu zakresowi — nigdy nie zaglądaj do dalszych rozdziałów!
2. **Przy pierwszej prawdziwej dostawie** usuń zaślepkę techniczną (`grep -rl zaslepka content/ rozgrywka/`).
3. **Zapisz surowy zapis** rozegranych wydarzeń w `rozgrywka/zapisy/` (plik archiwalny jest od tej chwili nietykalny).
4. **Podziel materiał na sceny** według wydarzeń fabularnych (wspólne miejsce, czas i rozmowa — ADR 0009), osadź dosłowne cytaty w `:::zapis`, napisz analizę z `sekcje_analizy`, zaktualizuj karty rozdziału, epizodu, postaci, frakcji, dzielnic, miejsc, wątków, kontekstów literackich i pojęć.
5. **Sprawdź dotychczasowe hipotezy.** Jeśli nowa scena potwierdza, zawęża lub obala wcześniejsze `{{model pewnosc=…}}`, przenieś dosłowne stare brzmienie do `interpretacje:` we frontmatterze (ADR 0007).
6. **Przesuń `rozgrywka/postep.json`** (`ostatnia_scena`) i dopisz zwięzły wpis na górze `content/co-nowego.md`.
7. **Po każdej domkniętej porcji** uruchom `npm test && npm run zapis && npm run build`, zrób osobny commit i natychmiast `git push origin <bieżąca-gałąź>`.

### B. Pętla prac silnikowych i dokumentacyjnych

1. Każda zmiana w schemacie lub parserze wymaga równoczesnej aktualizacji [`docs/guides/SCHEMAT_DANYCH.md`](docs/guides/SCHEMAT_DANYCH.md) oraz testów w `test/`.
2. Nowa decyzja architektoniczna wymaga nowego pliku `docs/decisions/00NN-*.md` oraz wpisu w `docs/decisions/README.md` (nigdy nie nadpisuj po cichu historii przyjętych ADR-ów — zastąpienie starszej decyzji oznacza zmianę jej statusu na `zastąpiona przez 00NN`).
3. Commituj często i wypychaj każdy zielony krok.

---

## Krok 6 — Zamknięcie sesji

Przed oddaniem odpowiedzi właścicielowi upewnij się, że wszystkie punkty są spełnione:

- [ ] `npm test` przechodzi w 100%.
- [ ] `npm run zapis` kończy się kodem `0` bez przeredagowanych cytatów.
- [ ] `npm run build` oraz `npm run build:single -- --out /tmp/lcdb-single.html` przechodzą bez błędów (dzięki czemu `dist/` pod podglądem na żywo ma najświeższy artefakt).
- [ ] `git status --short` jest całkowicie czyste, a wszystkie commity są wypchnięte na `origin <bieżąca-gałąź>`.
- [ ] Opis PR-a na GitHubie (`gh pr edit <nr> --body-file /tmp/pr_body.md`) odzwierciedla wykonaną pracę (`[x]`), statystyki i wynik weryfikacji, a `gh pr checks <nr>` nie wykazuje czerwonych zadań CI.
- [ ] Proces `npm run serve` na `0.0.0.0:3000` nadal działa w tle.

---

## Bezwzględne zakazy

1. **Nigdy nie scalaj (`gh pr merge`) ani nie zamykaj (`gh pr close`) PR-a** — wyłączne prawo scalania na `main` ma właściciel (chyba że wyda jednoznaczne polecenie scalenia konkretnego numeru PR-a w wiadomości).
2. **Nigdy nie pushuj bezpośrednio na `main` i nigdy nie używaj `--force` / `--force-with-lease`.**
3. **Zero zależności w `package.json`** (`dependencies` i `devDependencies` nie istnieją — ADR 0002).
4. **Zero spoilerów i zero „proroczych hipotez”** — ani wprost, ani w przebraniu `{{model pewnosc=…}}`, ani w kartach `konteksty/` (ADR 0006, 0008, 0011).
5. **Zero słownictwa meta i growo-mechanicznego w widocznej treści kroniki** (ADR 0012).
6. **Nie commituj katalogu `dist/`, `google_drive/` ani archiwów `.zip`.**
