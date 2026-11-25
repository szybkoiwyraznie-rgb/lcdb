# Schemat danych kroniki (`docs/guides/SCHEMAT_DANYCH.md`)

Ten przewodnik opisuje strukturę kart w `content/`, słowniki dozwolonych wartości, relacje dwukierunkowe, cztery warstwy pochodzenia informacji oraz zapis hipotez i historii interpretacji. Wszystkie reguły są sprawdzane automatycznie przez `src/lcdb/registry.js` podczas `npm test` oraz `npm run build` ([ADR 0003](../decisions/0003-jeden-typ-na-katalog.md), [ADR 0004](../decisions/0004-opowiesc-przed-mechanika.md)).

---

## 1. Zasady ogólne pliku karty

1. **Jedna karta = jeden plik Markdown** w katalogu odpowiadającym jej typowi (`content/<katalog>/<slug>.md`).
2. **Nazwa pliku musi równać się `<slug>.md`.** Slug składa się wyłącznie z małych liter ASCII, cyfr i pojedynczych myślników (`^[a-z0-9]+(?:-[a-z0-9]+)*$`), po transliteracji polskich znaków (`ł → l`, `ś → s` itd.).
3. **Nieznane pole we frontmatterze to błąd budowania.** Chroni to graf powiązań przed literówkami (np. `postaci:` zamiast `postacie:`).
4. **Każdy akapit w ciele karty musi leżeć wewnątrz bloku pochodzenia** (`{{dostawa`, `{{opracowanie`, `{{kwerenda` albo `{{model`). Luźny tekst poza blokiem przerywa budowanie.

---

## 2. Pola wspólne wszystkich dziesięciu typów

| Pole | Wymagane | Typ | Opis |
|---|---|---|---|
| `typ` | tak | napis | Jedna z 10 nazw typów (`rozdzial`, `epizod`, `scena`, `watek`, `postac`, `organizacja`, `dzielnica`, `miejsce`, `pojecie`, `kontekst`); musi zgadzać się z katalogiem |
| `slug` | tak | napis | Unikalny identyfikator w całej kronice, równy nazwie pliku bez `.md` |
| `tytul` | tak | napis | Polski tytuł lub miano wyświetlane w nagłówku karty i na listach |
| `tytul_kr` | nie | napis | Oryginalny zapis koreański (np. `림버스 컴퍼니`, `수감자`), gdy wnosi wartość |
| `tytul_en` | nie | napis | Zapis angielski z oficjalnej lokalizacji, jeśli różni się od `tytul` |
| `streszczenie` | w `scena` tak | napis | Jednozdaniowy skrót na potrzeby list, kafelków i podtytułu karty (nie powtarza słowo w słowo `## Opis`) |
| `tagi` | nie | lista slugów | Powracające motywy łączące karty ponad podziałem na działy (np. `[zegar, zlota-galaz, pamiec]`) |
| `zrodla` | nie | lista URL | Dodatkowa lista adresów `http(s)://` na poziomie karty (nie zastępuje przypisów `{{zrodlo …}}` w blokach kwerendy!) |
| `utworzono` | nie | `RRRR-MM-DD` | Data założenia karty |
| `interpretacje` | nie | lista obiektów | Historia wcześniejszych odczytań i zmian pewności ([§6](#6-historia-interpretacji-interpretacje)) |

---

## 3. Dziesięć typów kart

### 3.1. `rozdzial` — `content/rozdzialy/`

Duża część opowieści: Prolog (*Selva Oscura*), kolejne Pieśni (*Canto*), antrakty (*Intervallo*) lub opowieści pomostowe.

- **Pola własne:**
  - `numer` (**wymagane**, liczba całkowita ≥ 1, ciągła numeracja `1..K` w kolejności opowieści),
  - `rodzaj_rozdzialu`: `prolog` | `canto` | `intervallo` | `opowiesc`,
  - `oznaczony`: zwięzłe oznaczenie z opowieści (np. `"Prolog"`, `"Canto I"`, `"Intervallo I"`),
  - `tytul_oboczny`: podtytuł rozdziału,
  - `grzesznik`: pojedynczy slug `postac` (wyłącznie wtedy, gdy rozegrana opowieść wskazuje postać stojącą w centrum danej Pieśni),
  - `status`: `rozegrane` | `w-toku` | `nierozpoczete`,
  - relacje: `epizody`, `watki`, `dzielnice`, `organizacje`, `postacie`, `nastepny` (slug kolejnego rozdziału).
- **Sekcja obowiązkowa:** `## Streszczenie`.

### 3.2. `epizod` — `content/epizody/`

Zwarty odcinek rozdziału skupiający kilka sąsiednich scen jednego ciągu zdarzeń (np. przebudzenie w lesie, pierwszy postój autobusu, zejście do podziemnego oddziału).

- **Pola własne:**
  - `rozdzial` (**wymagane**, slug `rozdzial`),
  - `kolejnosc` (**wymagane**, liczba całkowita ≥ 1, ciągła `1..M` w obrębie rozdziału),
  - `rodzaj`: `glowny` | `poboczny` | `spotkanie` | `zwiad` | `wspomnienie`,
  - `status`: `rozegrane` | `w-toku` | `nierozpoczete`,
  - relacje: `sceny`, `postacie`, `dzielnice`, `organizacje`, `miejsca`, `watki`, `konteksty`.
- **Sekcja obowiązkowa:** `## Streszczenie`.

### 3.3. `scena` — `content/sceny/`

Podstawowa jednostka dowodowa kroniki ([ADR 0009](../decisions/0009-scena-jedno-wydarzenie.md)): jedno wydarzenie w jednym miejscu i czasie, oparte o dosłowny wycinek archiwum rozgrywki.

- **Pola własne:**
  - `epizod` (**wymagane**, slug `epizod`),
  - `numer_sceny` (**wymagane**, napis w cudzysłowie, np. `"1-1"`),
  - `kolejnosc` (**wymagane**, globalna liczba całkowita ≥ 1, ciągła od `1` aż do `ostatnia_scena` w `rozgrywka/postep.json`),
  - `streszczenie` (**wymagane**, zwięzły opis przebiegu sceny na potrzeby list i chronologii),
  - `zapis` (**wymagane**, nazwa pliku w `rozgrywka/zapisy/`, np. `2026-11-25-001.md`),
  - `sekcje_analizy`: lista par `"Podsekcja analizy → Podsekcja treści"` wiążąca każdy nagłówek `###` w `## Analiza` z nagłówkiem `###` w `## Treść sceny`,
  - relacje: `postacie`, `dzielnice`, `miejsca`, `organizacje`, `pojecia`, `watki`, `konteksty`.
- **Sekcje obowiązkowe:** `## Treść sceny` (z co najmniej jednym blokiem `:::zapis ... :::` liczącym minimum 2 kwestie lub akapity narracji, dosłownie zgodnym z archiwum) oraz `## Analiza`.

### 3.4. `watek` — `content/watki/`

Nić fabularna, zagadka lub powracający konflikt biegnący przez wiele scen.

- **Pola własne:**
  - `rodzaj_watku` (**wymagane**): `glowny` | `poboczny` | `motyw` | `tajemnica` | `przeszlosc` | `polityczny` | `egzystencjalny` | `inne`,
  - `stan`: krótkie zdanie określające, w jakim punkcie zatrzymał się wątek na granicy fabuły,
  - relacje: `postacie`, `sceny`, `rozdzialy`, `epizody`, `organizacje`, `pojecia`, `konteksty`.
- **Sekcja obowiązkowa:** `## Opis`.

### 3.5. `postac` — `content/postacie/`

Każda nazwana lub wyraźnie działająca osoba z rozegranych scen (Grzesznicy, przewodnik, kierowca, wysłannicy korporacji, mieszkańcy Miasta).

- **Pola własne:**
  - `rola` (**wymagane**): `protagonista` | `grzesznik` | `przewodnik` | `sojusznik` | `antagonista` | `drugoplanowa` | `narrator` | `inne`,
  - `numer_grzesznika`: liczba całkowita ≥ 1 (wyłącznie wtedy, gdy numer porządkowy padł w rozegranym materiale lub aktach z dostawy),
  - `pseudonim`: przydomek lub oboczne miano (nie może powtarzać `tytul`),
  - `przydzial`: funkcja lub zajęcie znane z opowieści,
  - `pierwsze_wystapienie`: slug `scena`,
  - relacje jednostkowe: `organizacja` (główna przynależność), `dzielnica` (pochodzenie lub miejsce działania),
  - relacje wielokrotne: `organizacje`, `dzielnice`, `miejsca`, `watki`, `konteksty`, `pojecia`.
- **Sekcja obowiązkowa:** `## Opis`.

### 3.6. `organizacja` — `content/organizacje/`

Instytucje i zbiorowości Miasta: Skrzydła (Korporacje od A do Z), Zrzeszenia Fixerów, Syndykaty, Biura, oddziały firmy i inne ugrupowania.

- **Pola własne:**
  - `rodzaj` (**wymagane**): `korporacja` | `zrzeszenie` | `syndykat` | `biuro` | `oddzial` | `ugrupowanie` | `inne`,
  - relacje jednostkowe: `siedziba` (slug `miejsce`), `dzielnica` (slug `dzielnica`),
  - relacje wielokrotne: `dzielnice`, `postacie`, `watki`, `pojecia`, `konteksty`, `epizody`.
- **Sekcja obowiązkowa:** `## Opis`.

### 3.7. `dzielnica` — `content/dzielnice/`

Geografia Miasta i jego rubieży: Dzielnice (wraz z podziałem na Gniazda i Zaułki), Pojezierze, Pustkowia.

- **Pola własne:**
  - `rodzaj` (**wymagane**): `dzielnica` | `gniazdo` | `zaulki` | `obszar` | `rubiez` | `inne`,
  - `numer_dzielnicy`: liczba całkowita `1–26` (jeśli numer Dzielnicy został ujawniony),
  - `region`: szersze położenie w Mieście,
  - relacje: `rozdzial` (jednostkowa), `organizacje`, `postacie`, `miejsca`, `watki`, `pojecia`.
- **Sekcja obowiązkowa:** `## Opis`.

### 3.8. `miejsce` — `content/miejsca/`

Konkretna przestrzeń wydarzeń: autobus *Mefistofeles*, las, stacja, opuszczony oddział badawczy, ulica, posiadłość.

- **Pola własne:**
  - `rodzaj`: zwięzłe określenie miejsca (np. `"pojazd"`, `"laboratorium"`, `"las"`, `"stacja"`),
  - relacje jednostkowe: `dzielnica` (slug `dzielnica`), `organizacja` (slug `organizacja`),
  - relacje wielokrotne: `postacie`, `pojecia`, `konteksty`, `watki`.
  - *(Uwaga: miejsce nie ma pola `rozdzial` — wiąże się z geografią przez `dzielnica`.)*
- **Sekcja obowiązkowa:** `## Opis`.

### 3.9. `pojecie` — `content/pojecia/`

Hasła świata przedstawionego: zjawiska Miasta, Osobliwości, Złote Gałęzie, Abominacje, Zniekształcenia, manifestacje E.G.O, odbicia ze Światów Lustrzanych, przedmioty i pamiętne wydarzenia z przeszłości Miasta.

- **Pola własne:**
  - `rodzaj` (**wymagane**): `istota` | `zjawisko` | `technologia` | `przedmiot` | `obyczaj` | `wydarzenie` | `lustro` | `inne`,
  - relacje: `postacie`, `dzielnice`, `organizacje`, `miejsca`, `watki`, `konteksty`.
- **Sekcja obowiązkowa:** `## Opis`.

### 3.10. `kontekst` — `content/konteksty/`

Zewnętrzne odniesienia literackie, mitologiczne, filozoficzne i historyczne (np. *Boska komedia* Dantego, powieści i poematy stojące za postaciami, symbolika kabalistyczna) — prowadzone bez wyprzedzania fabuły ([ADR 0011](../decisions/0011-konteksty-literackie-i-kulturowe.md)).

- **Pola własne:**
  - `rodzaj` (**wymagane**): `powiesc` | `opowiadanie` | `poemat` | `dramat` | `mit` | `filozofia` | `historia` | `dzielo` | `termin` | `inne`,
  - `dzielo`: tytuł dzieła źródłowego,
  - `autor`: autor lub krąg kulturowy,
  - `rok`: liczba całkowita (dla starożytności ujemna, np. `-700` wyświetli się jako `700 p.n.e.`),
  - relacje: `postacie`, `pojecia`, `watki`.
- **Sekcja obowiązkowa:** `## Opis`.

---

## 4. Boksy `##` i cztery warstwy pochodzenia

Każdy nagłówek `## Tytuł` otwiera osobny boks w lewej kolumnie karty ([ADR 0005](../decisions/0005-jeden-boks-wiele-warstw.md)). Boks ma zwykły nagłówek z treści, natomiast pochodzenie wiedzy oznaczają bloki `{{pochodzenie` … `}}`:

```markdown
## Kontekst literacki

{{kwerenda
Pierwsza pieśń *Piekła* zaczyna się od przebudzenia w ciemnym lesie, w którym wędrowiec zgubił prostą drogę {{zrodlo tytul="Dante Alighieri, Inferno, Canto I — Digital Dante (Columbia University)" adres="https://digitaldante.columbia.edu/dante/divine-comedy/inferno/inferno-1/" data="2026-11-25"}}.
}}

{{model
W tradycji alegorycznej las oznacza stan zagubienia poprzedzający spotkanie z przewodnikiem.
}}

{{model pewnosc=55 pytanie="Dlaczego przewodnik odwołuje się do gwiazd zamiast wskazać drogę wprost?"
Zapowiedź podążania za gwiazdą wyznacza relację zależności między osobą bez pamięci a tym, kto zna cel marszu.
}}
```

Reguły walidacji warstw:

1. Dozwolone pochodzenia to wyłącznie: `dostawa`, `opracowanie`, `kwerenda`, `model`.
2. Każdy blok `{{kwerenda` **musi** zawierać co najmniej jedną dyrektywę `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}` z pełnym adresem `http(s)://` i poprawną kalendarzowo datą odczytu. W żadnym innym bloku `{{zrodlo …}}` nie jest dozwolone.
3. Blok `{{model` **bez** `pewnosc=` służy do ogólnego tła kulturowego/literackiego (żółta barwa) i nie przyjmuje atrybutu `pytanie=`.
4. Blok `{{model pewnosc=NN pytanie="…"` (gdzie `NN` to liczba całkowita `0–100`) tworzy fioletową warstwę hipotezy z plakietką pewności i własną kotwicą `#hip-…`.

---

## 5. Bloki dosłownego zapisu `:::zapis`

Na kartach `scena` sekcja `## Treść sceny` zawiera jeden lub więcej wycinków archiwum:

```markdown
{{dostawa

## Treść sceny

### Przebudzenie na polanie

:::zapis
**Nieznajomy:** Znowu stoisz w miejscu.
<…>
**Nieznajomy:** Czas ruszać, zanim zapadnie zmrok.
:::

}}
```

- Wnętrze `:::zapis` musi być **dosłownym podciągiem** (po normalizacji białych znaków) pliku wskazanego w polu `zapis:` w `rozgrywka/zapisy/`.
- Kwestie zegarowe `<…>` są automatycznie ucieczkowane przed formatowaniem i wyświetlają się w całości.
- Techniczne separatory etapów `#..######` z surowego archiwum zamieniają się wewnątrz `:::zapis` na dyskretną linię `<hr>`, dzięki czemu nie zdradzają wewnętrznych identyfikatorów gry.

---

## 6. Historia interpretacji (`interpretacje:`)

Gdy nowa scena zmienia wcześniejszy domysł, zapisujemy jego dawne brzmienie we frontmatterze karty ([ADR 0007](../decisions/0007-historia-interpretacji.md)):

```yaml
interpretacje:
  - data: "2026-11-25 18:30"
    fragment: "Analiza"
    pewnosc_poprzedniego: 35
    pewnosc: 75
    zmiana: "Rozmowa przy drugim przystanku potwierdziła, że przewodnik znał trasę jeszcze przed wyruszeniem."
    poprzednio: |
      Przewodnik sprawia wrażenie kogoś, kto improwizuje trasę na bieżąco.
```

Dozwolone pola wpisu: `data` (**wymagane**, `RRRR-MM-DD GG:MM`), `zmiana` (**wymagane**, opis przyczyny bez języka meta), `fragment` (**wymagane**, gdy podano `poprzednio` — dokładny tytuł boksu `## …`, w którym wyrenderuje się zwijany panel *Wcześniejsze odczytanie*), `poprzednio` (dosłowny zastąpiony tekst), `pewnosc` (`0–100`), `pewnosc_poprzedniego` (`0–100`), `autor`, `dotyczy`.
