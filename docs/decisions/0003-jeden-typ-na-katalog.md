# ADR 0003: Jeden typ strony na katalog, nieznane pole to błąd

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Gdy wiele sesji agentowych dopisuje dziesiątki kart, drobna literówka w nazwie pola frontmattera (np. `postaci:` zamiast `postacie:` albo `dzielnice:` z błędnym slugiem) mogłaby sprawić, że powiązanie po cichu zniknie z widoków i grafu.

## Decyzja

1. Każdy z 10 typów kart ma dokładnie jeden katalog w `content/` (`tools/content-loader.mjs` odrzuca plik, którego `typ:` nie zgadza się z katalogiem, albo którego nazwa pliku nie równa się `<slug>.md`).
2. Wszystkie slugi leżą w jednej globalnej przestrzeni nazw — duplikat między różnymi katalogami jest błędem budowania.
3. Każde pole spoza `POLA_DOZWOLONE[typ]` w `src/lcdb/registry.js` przerywa budowanie czytelnym komunikatem błędu.

## Konsekwencje

- Rozszerzenie schematu o nowe pole wymaga świadomej zmiany w `src/lcdb/registry.js` oraz w `docs/guides/SCHEMAT_DANYCH.md` (spójności obu pilnuje `test/dokumentacja.test.js`).
