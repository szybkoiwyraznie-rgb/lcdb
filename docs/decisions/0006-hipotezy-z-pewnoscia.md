# ADR 0006: Hipotezy jako wiedza modelu z pewnością i zakaz pozorowanych hipotez

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Opowieść *Limbus Company* buduje napięcie poprzez niedopowiedzenia, przemilczenia i wieloznaczne tropy. Kronika powinna rejestrować uzasadnione domysły na danym etapie podróży, ale z dwoma zabezpieczeniami: czytelnik musi widzieć siłę przesłanek, a agent nie może przemycać wiedzy treningowej o już wydanych dalszych Pieśniach pod postacią „proroczych hipotez”.

## Decyzja

1. Hipotezę zapisujemy jako blok `{{model pewnosc=NN pytanie="…"` … `}}`, gdzie `NN` jest liczbą całkowitą `0–100` rozumianą porządkowo:
   - `80–100` (*wysoka*) — wniosek silnie wsparty przez kilka niezależnych scen,
   - `50–79` (*średnia*) — spójne odczytanie z wyraźnymi lukami,
   - `1–49` (*niska*) — otwarty, wczesny trop.
2. Warstwa z `pewnosc=` otrzymuje klasę `rodzaj-interpretacja` (pełne fioletowe tło i obramowanie, plakietka `pewność NN%` po prawej stronie oraz kotwica `#hip-…`). Zwykły blok `{{model` bez `pewnosc=` pozostaje żółty i nie przyjmuje `pytanie=`.
3. **Zakaz pozorowanych hipotez:** każda hipoteza musi wynikać wyłącznie z faktów obecnych w materiale do `ostatnia_scena`. Wykorzystywanie pamięci modelu o przyszłych rozdziałach gry do formułowania „trafnych domysłów” jest traktowane na równi ze spoilerem.

## Konsekwencje

- Wszystkie aktywne hipotezy są automatycznie indeksowane na stronie głównej, w chronologii oraz w widoku `#/hipotezy`.
