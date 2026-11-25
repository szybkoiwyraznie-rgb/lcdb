# Działy treści kroniki (`content/`)

Każdy podkatalog w `content/` odpowiada dokładnie **jednemu typowi karty** (ADR 0003, 0004). Nazwa pliku `<slug>.md` musi być identyczna z polem `slug:` we frontmatterze YAML, a pole `typ:` musi zgadzać się z katalogiem.

---

## Mapa dziesięciu działów

| Katalog | `typ` | Co opisuje w świecie *Limbus Company* |
|---|---|---|
| `rozdzialy/` | `rozdzial` | Główne części podróży: Prolog, kolejne Pieśni (*Canto*), Interludia (*Intervallo*) oraz krótkie opowieści (*Notatki Dantego*, *Za Tylnymi Drzwiami*, *Noc Walpurgi*…) |
| `epizody/` | `epizod` | Zamknięte etapy i przystanki wewnątrz rozdziału (w tym wspomnienia, światy lustrzane i zapisy obserwacji) |
| `sceny/` | `scena` | Pojedyncze wydarzenia fabularne: dosłowny tekst w `:::zapis`, analiza z odsyłaczami `↦` do treści oraz konteksty |
| `watki/` | `watek` | Nici fabularne, obietnice, konflikty i nierozstrzygnięte pytania biegnące przez wiele scen |
| `postacie/` | `postac` | Grzesznicy (z opcjonalnym `numer_grzesznika: 1–13`), przewodnicy, pracownicy LCB, Fixerzy, członkowie Syndykatów i Korporacji, rozumne istoty |
| `frakcje/` | `frakcja` | Skrzydła Miasta (*Korporacje A–Z*), stowarzyszenia i biura Fixerów, warsztaty, syndykaty, wydziały Limbus Company, rody |
| `dzielnice/` | `dzielnica` | Geografia wielkiej skali: Dzielnice Miasta (`numer_dzielnicy: 1–26`), Gniazda, Zaułki, Obrzeża, Wielkie Jezioro, Ruiny |
| `miejsca/` | `miejsce` | Konkretne miejsca: autobus *Mefistofeles*, filie dawnej Lobotomy Corporation, stacje, laboratoria, kasyna, warsztaty |
| `konteksty/` | `kontekst` | Pierwowzory literackie, mitologiczne, filozoficzne i religijne (*Boska komedia*, powieści 12 Grzeszników, kabała…) — wyłącznie w zakresie motywów już obecnych w poznanych scenach |
| `pojecia/` | `pojecie` | Zjawiska i pojęcia świata: Złote Gałęzie, Anomalie, E.G.O, Osobliwości Skrzydeł, Światy Lustrzane, Zniekształcenia, prawa i tabu Miasta |

Dodatkowo plik **`content/co-nowego.md`** prowadzi zwięzły dziennik nowych odsłon opowieści wyświetlany na stronie głównej i pod trasą `#/co-nowego` (ADR 0014).

---

## Gdzie szukać pełnych reguł

- Pełny wykaz pól, słowników zamkniętych, warstw pochodzenia i historii interpretacji: [`../docs/guides/SCHEMAT_DANYCH.md`](../docs/guides/SCHEMAT_DANYCH.md).
- Instrukcja obróbki nowej dostawy scena po scenie: [`../docs/guides/PRZEPLYW_SCENY.md`](../docs/guides/PRZEPLYW_SCENY.md).
- Przed pierwszą prawdziwą dostawą w katalogach leży bezspoilerowa zaślepka techniczna oznaczona motywem `zaslepka` (`grep -rl zaslepka content/ rozgrywka/`).
