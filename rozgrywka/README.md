# Archiwum rozgrywki i granica fabuły (`rozgrywka/`)

Katalog `rozgrywka/` stanowi źródło prawdy o tym, **co dokładnie wydarzyło się już w poznanej opowieści** i **gdzie przebiega nieprzekraczalna granica bezspoilerowości** (ADR 0008, 0009).

---

## Zawartość katalogu

1. **`postep.json`** — wskazuje ostatnią opowiedzianą scenę:
   ```json
   {
     "ostatnia_scena": "slug-ostatniej-sceny"
   }
   ```
   Build (`npm run build`) oraz testy (`npm test`) odrzucają każdą kartę sceny w `content/sceny/`, której `kolejnosc` wykracza poza `kolejnosc` sceny wskazanej w `ostatnia_scena`.
2. **`zapisy/*.md`** — nietykalne archiwum tekstowe rozegranych fragmentów *Limbus Company*.
   - Raz zapisanego pliku archiwalnego z prawdziwej podróży **nie przeredagowujemy** (nie wygładzamy interpunkcji, nie poprawiamy stylu, nie usuwamy technicznych komentarzy węzłów `<!-- S001B -->`).
   - Każdy blok `:::zapis` w `content/sceny/*.md` musi być **dosłownym podciągiem** (z dokładnością do białych znaków) pliku wskazanego w polu `zapis:`. Pilnuje tego zarówno `npm run build`, jak i narzędzie `npm run zapis`.

---

## Konwencja nazewnictwa zapisów

Pliki prawdziwych dostaw w `rozgrywka/zapisy/` nazywamy:

```text
RRRR-MM-DD-<nr>-<krotki-slug>.md
```

np. `2026-11-26-001-prolog-las-mroku.md`, `2026-11-27-001-canto-1-wyrzutek.md`.

Wskazówki towarzyszące walce (objaśnienia sterowania przekazane osobno lub po znaczniku `*— Wskazówki —*`) archiwizujemy dosłownie w osobnym pliku z końcówką `-wskazowki.md`, np. `2026-11-27-002-prolog-selva-oscura-etap-0-1-wskazowki.md`. Takie archiwum nie jest podstawą żadnej sceny i nie podlega kontroli pokrycia; służy jako źródło nazw i obrazów świata (ADR 0016).

Akta Grzeszników i podobne dokumenty świata archiwizujemy dosłownie w osobnym pliku z końcówką `-akta.md`, np. `2026-11-27-004-grzesznicy-introdukcje-akta.md`. Takie archiwum nie jest podstawą żadnej sceny, ale każdy jego wiersz (poza nagłówkami) musi być dosłownie zacytowany w `:::zapis` na którejś karcie encji (ADR 0017).

---

## Konwencje zapisu dialogów *Limbus Company*

Materiały z czytanek *Limbus Company* posługują się kilkoma stałymi oznaczeniami, które silnik `lcdb` rozpoznaje bez naruszania dosłowności archiwum:

- `**Imię:** kwestia` oraz `**Imię** (*Tytuł / opis*): kwestia` — kwestie mówców (w tym postacie jeszcze nieznane z imienia, np. `**Wilk** (*???*):`).
- `\<…>` — wypowiedzi zegara Dantego zapisywane w nawiasach ostrokątnych poprzedzonych znakiem `\` (silnik zachowuje dosłowność względem archiwum, a w widoku czytelniczym wyświetla czyste `<…>`).
- `***` — słowo zatarte w pamięci mówiącego (np. `**Ja** (***):`, `gdy ryję ***…`); w widoku czytelniczym wyświetlane dosłownie jako wyciszone `***`, nigdy jako pogrubienie czy kursywa.
- `<!-- S001B -->` — techniczne identyfikatory węzłów opowieści; pozostają nietknięte w archiwum i w `:::zapis`, a renderer ukrywa je przed czytelnikiem.
- `*— Przed walką —*` / `*— Po walce —*` — znaczniki przejścia wewnątrz etapu; w widoku czytelniczym prezentowane są kursywą, ale nie rozbijają sztucznie narracji w liczniku elementów sceny.

---

## Zaślepka techniczna — usunięta

Bezspoilerowa zaślepka techniczna (startowy zapis i jedenaście kart z motywem zaślepki) została usunięta przy pierwszej prawdziwej dostawie: `2026-11-27-001-prolog-selva-oscura-etap-0-1.md` (LC_0_1). Wyszukiwanie motywu zaślepki (jej łacińskiego zapisu, bez polskich znaków) w `content/` i `rozgrywka/` ma nie zwracać żadnego pliku — dlatego ten akapit celowo go nie przytacza.
