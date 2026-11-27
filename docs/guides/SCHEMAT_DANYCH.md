# Schemat danych kroniki (`docs/guides/SCHEMAT_DANYCH.md`)

Autorytatywny opis struktury plików w `content/`, dozwolonych pól frontmattera, słowników zamkniętych, warstw pochodzenia i historii interpretacji egzekwowanych przez `src/lcdb/registry.js`, `src/lcdb/markdown.js` oraz `tools/content-loader.mjs`.

Każda niezgodność z tym schematem przerywa `npm run build` i `npm test`.

---

## 1. Zasady ogólne plików kart

1. **Jeden typ na katalog (ADR 0003):**
   - `content/rozdzialy/<slug>.md` → `typ: rozdzial`
   - `content/epizody/<slug>.md` → `typ: epizod`
   - `content/sceny/<slug>.md` → `typ: scena`
   - `content/watki/<slug>.md` → `typ: watek`
   - `content/postacie/<slug>.md` → `typ: postac`
   - `content/frakcje/<slug>.md` → `typ: frakcja`
   - `content/dzielnice/<slug>.md` → `typ: dzielnica`
   - `content/miejsca/<slug>.md` → `typ: miejsce`
   - `content/konteksty/<slug>.md` → `typ: kontekst`
   - `content/pojecia/<slug>.md` → `typ: pojecie`
2. **Jedna przestrzeń nazw `slug`:** każdy `slug` jest unikalny w całej kronice, pasuje do wzorca `^[a-z0-9]+(?:-[a-z0-9]+)*$` (małe litery ASCII, cyfry, myślniki) i zgadza się z nazwą pliku `<slug>.md`.
3. **Ścisły podzbiór YAML we frontmatterze (ADR 0002):** wartości zawierające `:` lub `#` (poza pełnymi adresami `http(s)://…` i skalarami blokowymi `|`) muszą być ujęte w cudzysłów `"…"`. Nieznane pole frontmattera jest błędem buildu.

---

## 2. Pola wspólne wszystkich dziesięciu typów

| Pole | Wymagane | Kształt | Znaczenie |
|---|---|---|---|
| `typ` | tak | słownik `TYPY_STRON` | Tożsamość karty zgodna z katalogiem |
| `slug` | tak | `SLUG_RE` | Unikalny identyfikator zgodny z nazwą pliku |
| `tytul` | tak | tekst | Polski tytuł czytelniczy karty |
| `tytul_kr` | nie | tekst | Oryginalny zapis koreański / hanja (np. `수감자`, `황금가지`) |
| `tytul_en` | nie | tekst | Oficjalny zapis angielski z lokalizacji gry (np. `Selva Oscura`, `Golden Bough`) |
| `tagi` | nie | tablica slugów ASCII | Motywy przewodnie łączące karty w widoku `#/tagi` |
| `zrodla` | nie | tablica URL `http(s)` | Dodatkowe odsyłacze źródłowe strony |
| `utworzono` | nie | `RRRR-MM-DD` | Kalendarzowa data założenia karty |
| `interpretacje` | nie | lista obiektów | Historia zrewidowanych interpretacji (zob. p. 6) |

---

## 3. Pola szczegółowe i słowniki zamknięte według typu

### 3.1. `rozdzial` (`content/rozdzialy/`)
- **Obowiązkowe sekcje `##`:** `Streszczenie`.
- **Pola własne:**
  - `numer` *(wymagane, liczba całkowita ≥ 1, ciągła od 1)* — kolejność rozdziału w kronice.
  - `oznaczenie` *(opcjonalne, tekst)* — np. `"Prolog"`, `"Pieśń I"`, `"Interludium I"`.
  - `rodzaj_rozdzialu` *(opcjonalne)* — słownik `RODZAJE_ROZDZIALU`: `prolog`, `canto`, `intervallo`, `opowiadanie`, `inne`.
  - `tytul_oboczny` *(opcjonalne, tekst)* — podtytuł lub dewiza rozdziału.
  - `czas_akcji` *(opcjonalne, tekst)* — czas w kalendarzu Miasta, np. `"984-01"`.
  - `status` *(opcjonalne)* — słownik `STATUSY`: `rozegrane`, `w-toku`, `nierozpoczete`.
  - Relacje: `epizody` (`epizod[]`), `watki` (`watek[]`), `dzielnice` (`dzielnica[]`), `frakcje` (`frakcja[]`), `postacie` (`postac[]`), `nastepny` (`rozdzial`).

### 3.2. `epizod` (`content/epizody/`)
- **Obowiązkowe sekcje `##`:** `Streszczenie`.
- **Pola własne:**
  - `rozdzial` *(wymagane, slug `rozdzial`)* — nadrzędny rozdział.
  - `kolejnosc` *(wymagane, liczba całkowita ≥ 1, ciągła wewnątrz rozdziału)*.
  - `rodzaj` *(opcjonalne)* — słownik `RODZAJE_EPIZODU`: `glowny`, `poboczny`, `wspomnienie`, `lustro`, `obserwacja`, `spotkanie`.
  - `status` *(opcjonalne)* — `rozegrane`, `w-toku`, `nierozpoczete`.
  - Relacje: `sceny` (`scena[]`), `postacie` (`postac[]`), `dzielnice` (`dzielnica[]`), `frakcje` (`frakcja[]`), `miejsca` (`miejsce[]`), `watki` (`watek[]`), `konteksty` (`kontekst[]`), `pojecia` (`pojecie[]`).

### 3.3. `scena` (`content/sceny/`)
- **Obowiązkowe sekcje `##`:** `Treść sceny`, `Analiza` (oraz dowolne dodatkowe sekcje `##`, np. `Nawiązania literackie i kulturowe`).
- **Pola własne:**
  - `epizod` *(wymagane, slug `epizod`)*.
  - `numer_sceny` *(wymagane, niepusty tekst, np. `"0-1"`, `"1-3"`)*.
  - `kolejnosc` *(wymagane, liczba całkowita ≥ 1, ciągła globalnie od 1 do `ostatnia_scena` w `rozgrywka/postep.json` — ADR 0008)*.
  - `streszczenie` *(wymagane, jedno–dwa zdania opisu wydarzenia)*.
  - `zapis` *(wymagane, ścieżka do pliku w `rozgrywka/zapisy/*.md` — ADR 0009)*.
  - `sekcje_analizy` *(opcjonalne, wymagane gdy `## Analiza` ma podsekcje `###`)* — tablica par `"Podsekcja analizy → Podsekcja treści"` budująca skoki `↦`.
  - Relacje: `postacie`, `dzielnice`, `miejsca`, `frakcje`, `watki`, `konteksty`, `pojecia`.
- **Rozmiar minimalny:** bloki `:::zapis` sceny muszą liczyć łącznie co najmniej `4` elementy dialogu/narracji (`MIN_ELEMENTOW_SCENY`).

### 3.4. `watek` (`content/watki/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj_watku` *(opcjonalne)* — słownik `RODZAJE_WATKU`: `glowny`, `poboczny`, `osobisty`, `motyw`, `tajemnica`, `polityczny`, `egzystencjalny`, `inne`.
  - `stan` *(opcjonalne)* — słownik `STANY_WATKU`: `otwarty`, `w-toku`, `zawieszony`, `zamkniety`.
  - Relacje: `postacie`, `sceny`, `rozdzialy`, `epizody`, `frakcje`, `konteksty`, `pojecia`.

### 3.5. `postac` (`content/postacie/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rola` *(opcjonalne)* — słownik `ROLE_POSTACI`: `grzesznik`, `protagonista`, `przewodnik`, `sojusznik`, `antagonista`, `drugoplanowa`, `narrator`, `istota`, `inne`.
  - `numer_grzesznika` *(opcjonalne, liczba całkowita `1`–`13`)* — numer więźnia/Grzesznika LCB (np. Yi Sang = `1`, Dante = `10`, Gregor = `13`).
  - `przydzial` *(opcjonalne, tekst)* — funkcja lub stanowisko w świecie opowieści.
  - `pseudonim` *(opcjonalne, tekst lub tablica tekstów)* — przydomki, tytuły, wcześniejsze miana.
  - Relacje pojedyncze: `pierwsze_wystapienie` (`scena`), `frakcja` (`frakcja`), `dzielnica` (`dzielnica`).
  - Relacje mnogie: `frakcje`, `dzielnice`, `miejsca`, `watki`, `konteksty`, `pojecia`.

### 3.6. `frakcja` (`content/frakcje/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj` *(opcjonalne)* — słownik `RODZAJE_FRAKCJI`: `skrzydlo`, `korporacja`, `stowarzyszenie`, `biuro`, `syndykat`, `wydzial`, `warsztat`, `ugrupowanie`, `rodzina`, `inne`.
  - `skrot` *(opcjonalne, tekst)* — np. `"LCB"`, `"LCCA"`, `"D Corp."`, `"Zwei"`.
  - Relacje pojedyncze: `siedziba` (`miejsce`), `dzielnica` (`dzielnica`).
  - Relacje mnogie: `dzielnice`, `postacie`, `watki`, `konteksty`, `epizody`, `pojecia`.

### 3.7. `dzielnica` (`content/dzielnice/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj` *(opcjonalne)* — słownik `RODZAJE_DZIELNICY`: `dzielnica`, `gniazdo`, `zaulki`, `obrzeza`, `ruiny`, `jezioro`, `obszar`, `inne`.
  - `numer_dzielnicy` *(opcjonalne, liczba całkowita `1`–`26`)* — numer Dzielnicy Miasta odpowiadający literom A–Z.
  - `region` *(opcjonalne, tekst)* — położenie w skali Miasta (np. północna / wschodnia część Miasta).
  - Relacje pojedyncze: `frakcja` (`frakcja`, np. zarządzające Skrzydło), `rozdzial` (`rozdzial`).
  - Relacje mnogie: `frakcje`, `postacie`, `miejsca`, `watki`.

### 3.8. `miejsce` (`content/miejsca/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj` *(opcjonalne, niepusty tekst swobodny)* — np. `autobus`, `podziemna filia`, `kasyno`, `stacja kolejowa`.
  - Relacje pojedyncze: `dzielnica` (`dzielnica`), `frakcja` (`frakcja`).
  - Relacje mnogie: `postacie`, `watki`, `konteksty`, `pojecia`.

### 3.9. `kontekst` (`content/konteksty/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj` *(opcjonalne)* — słownik `RODZAJE_KONTEKSTU`: `powiesc`, `opowiadanie`, `poemat`, `dramat`, `ksiega`, `mitologia`, `filozofia`, `religia`, `historia`, `gra`, `termin`, `inne`.
  - `dzielo` *(opcjonalne, tekst)*, `autor` *(opcjonalne, tekst)*, `rok` *(opcjonalne, liczba lub tekst)*.
  - Relacje mnogie: `postacie`, `frakcje`, `miejsca`, `pojecia`, `watki`.

### 3.10. `pojecie` (`content/pojecia/`)
- **Obowiązkowe sekcje `##`:** `Opis`.
- **Pola własne:**
  - `rodzaj` *(opcjonalne)* — słownik `RODZAJE_POJECIA`: `anomalia`, `ego`, `osobliwosc`, `zjawisko`, `lustro`, `przedmiot`, `bron`, `wydarzenie`, `prawo`, `obyczaj`, `inne`.
  - Relacje mnogie: `postacie`, `dzielnice`, `frakcje`, `miejsca`, `watki`, `konteksty`.

---

## 4. Cztery pochodzenia informacji i hipotezy wewnątrz boksów (ADR 0005, 0006)

Każdy boks otwierany jest nagłówkiem `## Tytuł sekcji`, a każdy akapit, lista, tabela lub cytat wewnątrz boksu **musi** leżeć wewnątrz bloku pochodzenia otwieranego osobną linią `{{pochodzenie …` i zamykanego osobną linią `}}`:

1. **`{{dostawa`** — dosłowne słowa z materiału opowieści (w tym bloki `:::zapis … :::`, cytaty z *Notatek Dantego*, akt Grzeszników i logów obserwacyjnych).
2. **`{{opracowanie`** — streszczenie i wnioski wynikające bezpośrednio i jednoznacznie z poznanych scen. Także nazwy i tytuły świata wzięte ze wskazówek towarzyszących walce — zawsze z jawnym wskazaniem tego źródła w zdaniu (ADR 0016).
3. **`{{kwerenda`** — twierdzenie zewnętrzne (literackie, historyczne, językowe) potwierdzone sprawdzonym źródłem. **Wymaga** co najmniej jednej dyrektywy inline:
   ```markdown
   {{kwerenda
   Treść sprawdzona w źródle. {{zrodlo tytul="Tytuł źródła" adres="https://…" data="2026-11-25"}}
   }}
   ```
4. **`{{model`** *(bez `pewnosc=`)* — niesporne, ogólne tło literackie lub kulturowe z wiedzy modelu niewymagające przypisu ani szacowania prawdopodobieństwa.
5. **`{{model pewnosc=NN pytanie="…"`** *(gdzie `NN` to liczba całkowita `0`–`100`)* — **interpretacja / hipoteza** (kolor fioletowy), automatycznie zbierana w widoku `#/hipotezy`:
   - `80–100` — wysoka pewność (mocne przesłanki w kilku miejscach tekstu),
   - `50–79` — średnia pewność (najspójniejsze odczytanie dotychczasowych poszlak),
   - `1–49` — niska pewność (ostrożne pytanie lub jedna z kilku równoprawnych możliwości).

Bloków pochodzenia nie wolno zagnieżdżać jeden w drugim; w obrębie jednego boksu `##` układa się je kolejno pod sobą.

---

## 5. Wikilinki

W treści warstw (poza blokiem `:::zapis`, który jest nietykalnym cytatem z archiwum) encje łączymy wikilinkami:

- `[[slug]]` — wstawia link z domyślnym tytułem docelowej karty,
- `[[slug|odmieniona nazwa w zdaniu]]` — wstawia link z podaną etykietą polską.

Martwy wikilink do nieistniejącego sluga zatrzymuje build.

---

## 6. Historia interpretacji (`interpretacje:` — ADR 0007)

Gdy nowa scena zmusza do zmiany wcześniejszego wniosku lub hipotezy, dopisz wpis do pola `interpretacje:` we frontmatterze karty:

```yaml
interpretacje:
  - data: "2026-11-26 18:40"
    fragment: Analiza
    zmiana: Rozmowa w autobusie wykluczyła dobrowolny udział najemników.
    pewnosc_poprzedniego: 55
    pewnosc: 85
    poprzednio: |
      Dosłowne brzmienie zastąpionego akapitu hipotezy przed korektą.
```

- Pole `fragment` musi dokładnie odpowiadać tytułowi istniejącej sekcji `## <fragment>` na tej karcie.
- Silnik automatycznie wyrenderuje pod tą sekcją zwijany blok `<details class="historia-interpretacji">` z nagłówkiem *Poprzednia wersja*.
