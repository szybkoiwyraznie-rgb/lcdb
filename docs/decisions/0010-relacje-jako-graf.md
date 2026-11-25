# ADR 0010: Dwukierunkowy graf powiązań z pól i wikilinków

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Świat Miasta tworzy gęstą sieć zależności między osobami, Skrzydłami, Syndykatami, Dzielnicami, wątkami i dziełami literackimi. Ręczne dopisywanie linków zwrotnych po obu stronach każdej relacji nieuchronnie prowadzi do rozjazdów.

## Decyzja

1. Każde pole relacji we frontmatterze (`POLA_RELACJI` w `src/lcdb/registry.js`) oraz każdy wikilink `[[slug]]` / `[[slug|etykieta]]` w ciele karty i w historii interpretacji jest weryfikowany pod kątem istnienia celu i zgodności typu.
2. Etap budowania automatycznie wylicza tablicę odsyłaczy przychodzących (`backlinki`) dla każdej karty.
3. Prawa kolumna karty encji (`src/lcdb/render-encja.js`) łączy odsyłacze wychodzące i przychodzące w jeden uporządkowany dział **Powiązania**, pogrupowany według typu kart i pozbawiony technicznych strzałek kierunku.

## Konsekwencje

- Wystarczy zapisać powiązanie po jednej stronie (np. wymienić postać w obsadzie sceny), aby scena automatycznie pojawiła się w powiązaniach na karcie tej postaci.
