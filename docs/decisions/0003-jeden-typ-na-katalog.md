# 0003. Jeden typ karty na katalog i zamknięty słownik pól ze swobodą sekcji oraz motywów

Status: przyjęta (2026-11-25)

## Kontekst

W rosnącym grafie setek kart literówka w nazwie pola frontmattera (np. `postaci:` zamiast `postacie:` albo `dzielnice:` z błędem) sprawiłaby, że powiązanie zniknie z widoku bez śladu. Jednocześnie narzucanie sztywnej listy dopuszczalnych nagłówków `##` lub zamkniętej listy tagów krępowałoby opis tak różnorodnych zjawisk jak starcia z Anomaliami, retrospekcje Grzeszników czy eseje literackie.

## Decyzja

1. Każdy podkatalog `content/<dział>/` przyjmuje karty wyłącznie jednego typu (`KATALOGI` w `tools/content-loader.mjs`), a nazwa pliku `<slug>.md` musi pokrywać się z polem `slug:`.
2. Lista dozwolonych kluczy frontmattera (`POLA_DOZWOLONE` w `src/lcdb/registry.js`) oraz słowniki ról, rodzajów i statusów są **zamknięte** — każde nieznane pole przerywa build.
3. Poza obowiązkowymi sekcjami rdzeniowymi (`Streszczenie` dla rozdziału/epizodu, `Treść sceny` + `Analiza` dla sceny, `Opis` dla pozostałych kart) autor karty ma pełną swobodę dodawania kolejnych sekcji `##` oraz slugowych motywów w polu `tagi:`.

## Konsekwencje

- Graf relacji pozostaje wolny od cichych literówek, przy zachowaniu swobody narracyjnej wewnątrz kart.
