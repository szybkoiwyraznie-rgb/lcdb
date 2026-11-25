# 0009. Scena jako jedno wydarzenie fabularne i automatyczna kontrola dosłowności `:::zapis`

Status: przyjęta (2026-11-25)

## Kontekst

Pliki dialogowe *Limbus Company* dzielą narrację według technicznych węzłów starć (`<!-- S001B -->` przed walką, `<!-- S001A -->` po walce). Zdarza się, że pojedynczy węzeł liczy zaledwie dwie wymiany zdań w tym samym pomieszczeniu. Jednocześnie swobodne parafrazowanie dialogów zamiast cytatu zamieniłoby materiał dowodowy w niepewne streszczenie.

## Decyzja

1. Jednostką `content/sceny/` jest **jedno spójne wydarzenie fabularne** (wspólne miejsce, czas i rozmowa lub starcie), a nie surowy identyfikator węzła. Krótkie sąsiadujące węzły tego samego zdarzenia łączymy w jedną scenę z podsekcjami `###` wewnątrz `## Treść sceny`. Brama `MIN_ELEMENTOW_SCENY = 4` odrzuca mikrosceny.
2. Każda scena wskazuje w polu `zapis:` plik archiwum w `rozgrywka/zapisy/`, a każdy blok `:::zapis … :::` musi być **dosłownym podciągiem** tego archiwum (sprawdzanym przez `sprawdzWiernoscSceny` w buildzie oraz `npm run zapis`).
3. Jeśli `## Analiza` posiada podsekcje `###`, pole `sekcje_analizy:` musi jawnie powiązać każdą z nich z odpowiednią podsekcją `###` w `## Treść sceny`, generując dwukierunkowo czytelne skoki `↦`.

## Konsekwencje

- Sceny czytają się jak naturalne rozdziały dramatu, a każda linijka cytatu jest mechanicznie poświadczona archiwum rozgrywki.
