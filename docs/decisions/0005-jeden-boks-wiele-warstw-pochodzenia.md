# 0005. Jeden boks z neutralnym tytułem i czterema kolorami pochodzenia informacji

Status: przyjęta (2026-11-25)

## Kontekst

Jedna sekcja tematyczna karty (np. `## Opis` postaci albo `## Analiza` sceny) niemal zawsze łączy zdania o różnym statusie dowodowym: dosłowny szczegół z dialogu, syntetyczne podsumowanie wydarzeń, fakt historyczno-literacki ze źródła zewnętrznego oraz ostrożną interpretację. Przypisywanie jednego koloru całemu boksowi zmuszałoby do sztucznego mnożenia nagłówków albo mieszania faktów z domysłami.

## Decyzja

1. Nagłówek `## Tytuł` otwiera neutralny boks tematyczny bez własnego koloru.
2. Wewnątrz boksu każdy fragment treści musi leżeć w jawnej warstwie jednego z czterech pochodzeń:
   - `{{dostawa` — słowa i fakty wyjęte bezpośrednio z tekstu opowieści,
   - `{{opracowanie` — streszczenie i wnioski wynikające jednoznacznie z poznanych scen,
   - `{{kwerenda` — wiedza zewnętrzna potwierdzona obowiązkową dyrektywą `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`,
   - `{{model` — ogólne tło literackie/kulturowe (lub fioletowa interpretacja, gdy podano `pewnosc=`).
3. Tekst pozostawiony luzem poza blokiem pochodzenia oraz blok `{{kwerenda` pozbawiony ważnego przypisu `{{zrodlo …}}` przerywają build.

## Konsekwencje

- Czytelnik na pierwszy rzut oka odróżnia to, co padło w samej historii, od opracowania, sprawdzonych źródeł zewnętrznych i przypuszczeń.
