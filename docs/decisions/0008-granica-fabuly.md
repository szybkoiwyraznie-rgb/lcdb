# ADR 0008: Twarda granica rozegranej fabuły (`rozgrywka/postep.json`)

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Kronika powstaje dla właściciela będącego w trakcie poznawania *Limbus Company*. Pojedyncze zdanie zdradzające dalszy los postaci lub rozwiązanie zagadki nieodwracalnie psuje lekturę.

## Decyzja

1. Plik `rozgrywka/postep.json` przechowuje w polu `ostatnia_scena` slug ostatniej rozegranej i opracowanej sceny.
2. Każda karta `content/sceny/*.md` ma globalne pole `kolejnosc` (`1..N`). Funkcja `sprawdzGraniceFabuly` w `src/lcdb/registry.js` przerywa budowanie, jeśli:
   - brakuje pliku `rozgrywka/postep.json` lub wskazanej w nim sceny,
   - ciąg `1..N` ma lukę albo duplikat,
   - którakolwiek scena ma `kolejnosc` większą niż `ostatnia_scena`.
3. Ta sama granica obowiązuje redakcyjnie wszystkie karty `postac`, `organizacja`, `dzielnica`, `miejsce`, `pojecie`, `watek` oraz `kontekst`: nic spoza `ostatnia_scena` nie może pojawić się w kronice.

## Konsekwencje

- Przy każdej nowej dostawie przesunięcie `rozgrywka/postep.json` jest świadomym, jawnym krokiem otwierającym miejsce na nowe sceny.
