# 0010. Relacje encji jako automatycznie odwracany graf dwukierunkowy

Status: przyjęta (2026-11-25)

## Kontekst

W świecie *Limbus Company* sieć powiązań między Grzesznikami, Skrzydłami, Syndykatami, Dzielnicami, miejscami, wątkami i dziełami literackimi jest gęsta. Wymaganie ręcznego wpisywania każdej relacji symetrycznie po obu stronach prowadzi do ciągłych braków, a tworzenie osobnych plików typu „relacja A–B” rozmywa narrację na dziesiątki drobnych kart.

## Decyzja

1. Nie wprowadzamy osobnego typu karty `relacja` — charakter więzi między postaciami i ugrupowaniami opisujemy żywym słowem wewnątrz sekcji ich kart (np. `## Relacje`, `## Wobec załogi autobusu`).
2. Wszystkie pola z `POLA_RELACJI` oraz wszystkie wikilinki `[[slug]]` w treści są walidowane pod kątem istnienia i typu celu, a silnik automatycznie wylicza odwrotne powiązania (`backlinki` i `powiazaniaStrony`), wyświetlając w kolumnie bocznej każdej encji komplet powiązanych kart oraz sekcję `W opowieści` ze scenami chronologicznymi.

## Konsekwencje

- Wystarczy powiązać nową scenę lub wątek z jednego miejsca, by obie strony połączenia były widoczne i klikalne w całej kronice.
