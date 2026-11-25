# ADR 0012: Kronika mówi o świecie, nie o sobie (brama języka)

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Agenty AI mają silną skłonność do pisania o samym procesie redagowania zamiast o świecie opowieści („w tej bazie”, „w dostarczonym transkrypcie”, „na ekranie wyboru gracz widzi”, „w niniejszej sekcji”). Taki język natychmiast wyrywa czytelnika z historii.

## Decyzja

1. W prozie kart `content/<dział>/*.md`, w tytułach boksów, w streszczeniach oraz w dzienniku `content/co-nowego.md` obowiązuje całkowity zakaz języka meta, redakcyjnego, bazodanowego i interfejsowego.
2. Zestaw testów `test/jezyk.test.js` skanuje wyrenderowane karty (z wyłączeniem dosłownych cytatów `:::zapis` oraz warstwy `wiedza modelu`, która z natury rozważa alternatywne odczytania) i przerywa CI na każdym wykrytym zwrocie meta.

## Konsekwencje

- Czystość stylu kroniki jest pilnowana automatycznie przy każdym commicie, a nie wyłącznie przez ręczną korektę.
