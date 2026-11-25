# ADR 0007: Historia interpretacji w miejscu twierdzenia zamiast cichej poprawki

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

W miarę rozgrywki wcześniejsze domysły ulegają obaleniu, zawężeniu lub potwierdzeniu. Ciche wykasowanie dawnej hipotezy z karty odbiera czytelnikowi pamięć o tym, jak opowieść zwodziła lub stopniowo odsłaniała prawdę.

## Decyzja

1. Każda zmiana merytoryczna wcześniejszej hipotezy lub odczytania trafia do pola `interpretacje:` we frontmatterze karty (`data: RRRR-MM-DD GG:MM`, `fragment: <Tytuł boksu ##>`, `zmiana`, dosłowne `poprzednio`, opcjonalnie `pewnosc_poprzedniego` i `pewnosc`).
2. `src/lcdb/registry.js` waliduje poprawność daty i zegara oraz sprawdza, czy `fragment` wskazuje istniejący boks `##` w ciele karty.
3. `tools/build.mjs` oraz `src/lcdb/markdown.js` renderują wewnątrz wskazanego boksu zwijany panel `<details class="historia-interpretacji">` z nagłówkiem **Wcześniejsze odczytanie**, przyczyną zmiany i dosłownym cytatem poprzedniej wersji.

## Konsekwencje

- Czytelnik widzi ewolucję rozumienia wątku dokładnie pod aktualnym twierdzeniem, bez konieczności przeszukiwania historii Gita.
