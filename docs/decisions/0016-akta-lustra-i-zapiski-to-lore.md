# ADR 0016: Akta, Światy Lustrzane, Abominacje i Zapiski z dostawy są materiałem opowieści

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

W *Limbus Company* znaczna część wiedzy o Mieście — ustroju Skrzydeł, zwyczajach Syndykatów i Zrzeszeń, alternatywnych losach Grzeszników w Światach Lustrzanych, naturze Abominacji i Zniekształceń oraz notatkach narratora — znajduje się poza głównymi dialogami scen: w aktach rekrutacyjnych, opowieściach Tożsamości, dziennikach obserwacji i *Zapiskach Dantego*. Odrzucenie ich dlatego, że w grze sąsiadują z ekranem wyposażenia, zubożyłoby obraz świata.

## Decyzja

1. Każdy dostarczony przez właściciela tekst akt, opowieści ze Światów Lustrzanych (*Tożsamości*), opisów E.G.O, dzienników obserwacji Abominacji oraz *Zapisków Dantego* wchodzi do kroniki jako pełnoprawny materiał o świecie (`{{dostawa` dla przytoczeń dosłownych, `{{opracowanie` dla syntezy).
2. Z materiałów tych usuwamy wyłącznie warstwę czysto mechaniczną: liczby monet, obrażenia, modyfikatory ataku i obrony, koszty zasobów, progi poczytalności oraz oznaczenia rzadkości (`0`, `00`, `000`).
3. Opowieści o wariantach ze Światów Lustrzanych otrzymują karty w `content/pojecia/` (`rodzaj: lustro`) powiązane z odpowiednią postacią, organizacją i dzielnicą, z wyraźnym zaznaczeniem w treści, że opisują odbicie lustrzane, a nie główną linię podróży autobusu.

## Konsekwencje

- Kronika gromadzi pełne bogactwo świata Miasta bez mieszania opowieści z mechaniką walki.
