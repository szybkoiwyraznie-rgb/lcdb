# ADR 0005: Jeden boks, wiele warstw — tytuł z treści, kolor ze źródła

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Czytelnik kroniki musi na pierwszy rzut oka odróżniać to, co padło w samej opowieści, od syntezy redakcyjnej, zewnętrznych przypisów encyklopedycznych i niezweryfikowanej wiedzy modelu. Jednocześnie jeden temat (np. `## Kontekst literacki` albo `## Analiza`) często łączy w sobie fakt potwierdzony zewnętrznym źródłem z dalszym rozwinięciem lub hipotezą.

## Decyzja

1. Każdy nagłówek `## Tytuł` otwiera wizualny boks `<section class="boks">` ze zwykłym, niepokolorowanym nagłówkiem `<h2>Tytuł</h2>`.
2. Barwa i etykieta należą wyłącznie do **warstw pochodzenia** (`.fragment.poziom-<pochodzenie>`) wewnątrz boksu:
   - `dostawa` (*z opowieści*) — neutralna barwa pergaminowa/grafitowa,
   - `opracowanie` (*opracowanie*) — stonowana zieleń,
   - `kwerenda` (*źródła sprawdzone*) — błękit, obowiązkowo zakończony listą przypisów z dyrektyw `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`,
   - `model` (*wiedza modelu*) — bursztynowa żółć dla ogólnego tła kulturowego bez przypisu albo fiolet dla hipotez z pewnością ([ADR 0006](0006-hipotezy-z-pewnoscia.md)).
3. Każdy akapit w karcie musi leżeć wewnątrz jednej z czterech warstw (`wymagajPoziomu: true` w `tools/build.mjs`).

## Konsekwencje

- Jeden boks może swobodnie zestawiać wiele warstw pochodzenia bez mnożenia sztucznych nagłówków o tej samej nazwie.
- Żadne zdanie w `kwerenda` nie przejdzie budowania bez pełnego adresu URL i kalendarzowej daty odczytu.
