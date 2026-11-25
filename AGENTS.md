# Instrukcja pracy agenta (`AGENTS.md`)

Ten plik jest **jedynym punktem wejścia** dla każdej sesji agenta pracującego nad kroniką opowieści *Limbus Company* (`lcdb`). Zanim zmienisz choćby jeden plik treści lub kodu, przeczytaj tę instrukcję w całości i wykonaj procedurę startową w podanej kolejności.

---

## 1. Misja projektu

`lcdb` to polskojęzyczna **kronika opowieści *Limbus Company*** prowadzona równolegle z rozgrywką właściciela:

- porządkuje **fabułę, sceny, postacie, relacje, wątki, organizacje Miasta, dzielnice, miejsca, hasła świata i konteksty literacko-kulturowe**,
- oddziela to, co padło **dosłownie w grze**, od **opracowania**, **sprawdzonych źródeł zewnętrznych** oraz **wiedzy i hipotez modelu**,
- rośnie **wyłącznie do miejsca, do którego dotarł właściciel** — bez najmniejszego wyprzedzania dalszych wydarzeń.

Komunikacja z właścicielem, opisy commitów, opisy PR-ów, dokumentacja, nazewnictwo w kodzie domenowym oraz treść kroniki powstają **po polsku**.

---

## 2. Obowiązkowa kolejność kroków na starcie sesji

Nie przestawiaj tej kolejności ([ADR 0014](docs/decisions/0014-sesja-galaz-pr-i-audyt.md)):

### Krok `(0)` — Uruchom stały podgląd na żywo (`0.0.0.0:3000`)

1. Sprawdź i odblokuj pełną historię Gita (w sandboxie klon bywa płytki):
   ```bash
   git rev-parse --abbrev-ref HEAD
   git rev-parse --is-shallow-repository   # jeśli true → git fetch --unshallow
   ```
2. Zbuduj witrynę (`npm run build`) i uruchom serwer w tle przez `start_process` (`command: "npm run serve"`, `name: "Kronika Limbus Company"`), a następnie potwierdź przez `get_process_output` (`wait_for: "port"`), że port `3000` nasłuchuje na `0.0.0.0`.
3. Serwer ma pozostać żywy przez całą sesję aż do zakończenia tury, żeby właściciel w każdej chwili widział aktualny podgląd w przeglądarce.

### Krok `(1)` — Otwórz PR sesji z planem (`1 sesja = 1 gałąź = 1 PR`)

1. Pracuj **wyłącznie** na gałęzi przypisanej do bieżącej sesji (`arena/…`). Nigdy nie przełączaj się na inną gałąź, nie twórz dodatkowych gałęzi i nie wypychaj niczego na `main`.
2. Jeśli na gałęzi sesji nie ma jeszcze otwartego PR-a do `main`, utwórz pierwszy pusty commit planu (`git commit --allow-empty -F /tmp/commit_msg.txt`), wypchnij gałąź (`git push -u origin <gałąź-sesji>`) i otwórz PR (`gh pr create --base main --head <gałąź-sesji> --body-file /tmp/pr_body.md`).
3. Opis PR-a jest **żywym dokumentem sesji** — aktualizuj go po każdym większym kroku (`gh api repos/szybkoiwyraznie-rgb/lcdb/pulls/<nr> -X PATCH -F body=@/tmp/pr_body.md`).

### Krok `(2)` — Lektura obowiązkowa

Przeczytaj przed podjęciem decyzji:

- [`ENVIRONMENT.md`](ENVIRONMENT.md) oraz [`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md) — ograniczenia sandboxa, odzyskiwanie po resecie, Google Drive, pułapki `gh`,
- [`docs/LESSONS.md`](docs/LESSONS.md) — błędy, które już raz się zdarzyły i nie mogą wrócić,
- [`docs/decisions/README.md`](docs/decisions/README.md) oraz właściwe ADR-y w `docs/decisions/`,
- [`docs/guides/SCHEMAT_DANYCH.md`](docs/guides/SCHEMAT_DANYCH.md) — pola, słowniki, warstwy pochodzenia i relacje,
- [`docs/guides/PRZEPLYW_SCENY.md`](docs/guides/PRZEPLYW_SCENY.md) — pełna procedura obróbki dostawy rozgrywki.

### Krok `(3)` — Trójczęściowy audyt poprzedniego scalonego PR-a

Sprawdź ostatni scalony PR na `main` (`git log main --merges -n 3` lub `gh api 'repos/szybkoiwyraznie-rgb/lcdb/pulls?state=closed&per_page=5'`). Jeśli istnieje scalony PR poprzedniej sesji, który nie ma jeszcze raportu w `docs/audits/`, wykonaj **niezależny audyt w trzech częściach**:

- **3a. Audyt merytoryczny** — wierność wobec zapisu w `rozgrywka/zapisy/`, kompletność obsady/miejsc/wątków ze sceny, brak halucynacji spoza dostawy, brak wyprzedzania fabuły, trafność kolorów pochodzenia i procentów pewności, czystość języka (zero meta).
- **3b. Audyt kodu i bram** — czy zmiany w `src/lcdb/`, `tools/` i `test/` nie osłabiły niezmienników, nie zostawiły martwych ścieżek ani regresji widoków.
- **3c. Audyt pozostałych zmian** — spójność dokumentacji, ADR-ów, `docs/LESSONS.md`, workflowów i konfiguracji.

Zapisz raport w `docs/audits/` (np. `docs/audits/pr-<nr>.md`), napraw znalezione usterki od razu w bieżącej sesji, a skrót wniosków dopisz do opisu bieżącego PR-a.

### Krok `(4)` — Wykonaj właściwą pętlę pracy

- **Gdy właściciel dostarczył nowy materiał z rozgrywki** (w wiadomości, załączniku lub we wskazanym pliku na Google Drive) → wykonaj **pętlę sceny** opisaną w [`docs/guides/PRZEPLYW_SCENY.md`](docs/guides/PRZEPLYW_SCENY.md).
- **Gdy brak nowej dostawy** (albo właściciel zlecił rozbudowę silnika / porządki / pogłębienie kontekstów) → wykonaj **pętlę jakości**: dopracuj wskazany obszar, zweryfikuj spójność powiązań, hipotez i źródeł w granicach `rozgrywka/postep.json`, zaostrz bramy testowe, jeśli ujawniła się luka.

---

## 3. Zasady pracy z Gitem i Pull Requestem

1. **Agent NIGDY sam nie scala (`gh pr merge`) i NIGDY sam nie zamyka (`gh pr close`) PR-a** — nawet gdy wszystkie testy są zielone, a właściciel chwali wynik lub pyta „czy to już jest na stronie?”. Scalenie należy wyłącznie do właściciela; zamknięcie lub scalenie PR-a kończy żywot sesji ([`docs/guides/ENVIRONMENT.md`](docs/guides/ENVIRONMENT.md) §2).
2. **Zakaz `--force` i `--force-with-lease`.** Zdalna gałąź jest źródłem prawdy na wypadek resetu kontenera.
3. **Commituj i wypychaj po każdym zielonym kroku** (`git push origin <gałąź-sesji>`). Opisy commitów przekazuj przez plik (`git commit -F /tmp/commit_msg.txt`), żeby uniknąć problemów z cudzysłowami i polskimi znakami w powłoce.
4. **Nie wrzucaj artefaktów ani surowych paczek do Gita:** katalogi `dist/`, `node_modules/` oraz `google_drive/` są ignorowane w `.gitignore` i nigdy nie trafiają do commitów.

---

## 4. Pięć nienaruszalnych praw kroniki

### 4.1. Fabuła przed mechaniką ([ADR 0004](docs/decisions/0004-opowiesc-przed-mechanika.md), [ADR 0016](docs/decisions/0016-akta-lustra-i-zapiski-to-lore.md))

- Dziesięć typów kart (`rozdzial`, `epizod`, `scena`, `watek`, `postac`, `organizacja`, `dzielnica`, `miejsce`, `pojecie`, `kontekst`) opisuje **świat Miasta i przebieg historii**, nie interfejs gry.
- Nie tworzymy kart umiejętności bojowych, monet, typów obrażeń, poziomów obrony, walut (*Lunacy*, odłamki), banerów losowań ani stopni rzadkości (`0` / `00` / `000`).
- Jednocześnie **akta Grzeszników**, **opowieści ze Światów Lustrzanych (*Tożsamości*)**, **dzienniki obserwacji Abominacji i opisy E.G.O** oraz ***Zapiski Dantego*** dostarczone z rozgrywki **są pełnoprawnym materiałem fabularnym**: wyjmujemy z nich każdą informację o ludziach, syndykatach, korporacjach i zjawiskach Miasta, odrzucając wyłącznie liczby mechaniczne.

### 4.2. Kronika mówi o świecie, nie o sobie ([ADR 0012](docs/decisions/0012-kronika-nie-mowi-o-sobie.md))

- W widocznej treści kart i dziennika `content/co-nowego.md` nie wolno używać żargonu redakcyjnego, bazodanowego ani interfejsowego („w tej bazie”, „w niniejszym wpisie”, „w dostawie”, „w sekcji”, „na ekranie gry”, „gracz wybiera”, „jeszcze nie wiemy z transkryptu”).
- O osobach i zdarzeniach piszemy z wnętrza opowieści; jedynym miejscem objaśniającym zasady oznaczeń jest strona `#/o-bazie` (*Jak czytać kronikę* — [ADR 0013](docs/decisions/0013-dziennik-i-jak-czytac-kronike.md)).
- Reguły strzeże automatycznie `test/jezyk.test.js`.

### 4.3. Cztery warstwy pochodzenia danych ([ADR 0005](docs/decisions/0005-jeden-boks-wiele-warstw.md))

Każdy akapit w `content/<dział>/*.md` musi leżeć wewnątrz jawnego bloku pochodzenia (brak bloku przerywa budowanie):

- `{{dostawa` … `}}` — słowa i opisy wzięte wprost z dostarczonego materiału rozgrywki (w tym bloki `:::zapis`),
- `{{opracowanie` … `}}` — streszczenie, zestawienie faktów i wnioski wynikające bezpośrednio z dostarczonego materiału,
- `{{kwerenda` … `}}` — kontekst potwierdzony zewnętrznym źródłem; **wymaga** wewnątrz bloku co najmniej jednej dyrektywy `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`,
- `{{model` … `}}` — ogólne tło literackie lub kulturowe przywołane bez zewnętrznego przypisu (żółta barwa, bez `pewnosc=`).

### 4.4. Hipotezy z pewnością i historią interpretacji ([ADR 0006](docs/decisions/0006-hipotezy-z-pewnoscia.md), [ADR 0007](docs/decisions/0007-historia-interpretacji.md))

- Każdy wniosek wykraczający poza to, co powiedziano wprost, zapisujemy jako `{{model pewnosc=NN pytanie="…"` … `}}` (gdzie `NN` to liczba całkowita `0–100` traktowana jako skala porządkowa: `80–100` mocne oparcie w kilku scenach, `50–79` prawdopodobny trop z lukami, `1–49` wczesne przypuszczenie).
- Gdy nowa scena obala, zawęża lub potwierdza wcześniejszą hipotezę, **nigdy nie nadpisujemy jej po cichu**: przenosimy dosłowne dawne brzmienie do listy `interpretacje:` we frontmatterze (`data: RRRR-MM-DD GG:MM`, `fragment: <Tytuł boksu ##>`, `zmiana`, `poprzednio`, `pewnosc_poprzedniego`, `pewnosc`). Silnik automatycznie wyrenderuje w tym boksie zwijany panel **Wcześniejsze odczytanie**.

### 4.5. Twarda granica fabuły i zakaz pozorowanych hipotez ([ADR 0008](docs/decisions/0008-granica-fabuly.md), [ADR 0011](docs/decisions/0011-konteksty-literackie-i-kulturowe.md))

- `rozgrywka/postep.json` (`ostatnia_scena`) wyznacza nieprzekraczalną granicę opowiedzianej historii.
- Ponieważ *Limbus Company* ma już wydane kolejne Pieśni (*Canto*), model językowy może pamiętać z treningu przyszłe zwroty akcji, ukryte tożsamości postaci i losy Grzeszników. **Bezwzględnie zakazane jest wykorzystywanie tej wiedzy — zarówno wprost, jak i pod postacią „trafnych hipotez” (`{{model pewnosc=…}}`) czy nadmiarowych analogii w kartach `kontekst`!**
- Każda hipoteza musi wynikać wyłącznie ze wskazówek obecnych w scenach do `ostatnia_scena` włącznie. Podobnie karta `kontekst` (np. *Boska komedia*, *Przemiana*, *Zbrodnia i kara*) omawia wyłącznie te motywy pierwowzoru, które rozegrana fabuła już uruchomiła, nigdy nie używając finału książki do zdradzania nieopowiedzianych rozdziałów gry.
- Jeśli na Google Drive leży szersza paczka tekstów gry (np. całe tłumaczenie lub zbiór plików), agentowi wolno wczytać i opracować **wyłącznie** odcinek wskazany przez właściciela jako rozegrany.

---

## 5. Bramy jakości przed każdym commitem i zamknięciem sesji

Żaden commit merytoryczny ani techniczny nie wchodzi na gałąź bez przejścia kompletu bram:

```bash
npm test          # 6 zestawów testów: silnik, integralność, język, trasy, ładowanie, dokumentacja
npm run zapis     # weryfikacja archiwów rozgrywka/zapisy/ i dosłowności :::zapis
npm run build     # pełne zbudowanie powłoki dist/index.html + dist/data/
```

Przed oddaniem głosu właścicielowi upewnij się również, że:

1. Wszystkie commity są wypchnięte na `origin <gałąź-sesji>` (`git status` czyste, `git log origin/<gałąź>..HEAD` puste).
2. Opis PR-a odzwierciedla rzeczywisty stan wykonanych prac i wyników bram.
3. Serwer podglądu (`start_process` na `0.0.0.0:3000`) działa po ostatnim `npm run build` i odpowiada kodem `200`.
