# ADR 0013: Dziennik nowego pokrycia i przewodnik „Jak czytać kronikę”

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Właściciel wracający do kroniki po kolejnej sesji chce od razu zobaczyć, które wątki i miejsca przybyły ostatnio. Nowy czytelnik potrzebuje z kolei jednego miejsca tłumaczącego cztery kolory warstw i procenty pewności — tak aby nie trzeba było tłumaczyć tych oznaczeń na samych kartach postaci i scen.

## Decyzja

1. Plik `content/co-nowego.md` prowadzi dziennik przyrostów opowieści (nagłówki `## RRRR-MM-DD GG:MM`), pisany językiem świata przedstawionego i prezentowany na stronie głównej oraz pod `#/co-nowego`.
2. Widok `#/o-bazie` (*Jak czytać kronikę* w `src/lcdb/render-o-bazie.js`), dostępny ze stopki każdej strony, jest jedynym miejscem w witrynie opisującym warstwy pochodzenia, progi pewności, historię zmian i granicę fabuły.

## Konsekwencje

- Karty fabularne pozostają wolne od objaśnień technicznych, a czytelnik w każdej chwili ma pod ręką legendę oznaczeń.
