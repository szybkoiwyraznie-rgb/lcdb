# Karty treści kroniki (`content/`)

Katalog zawiera wszystkie karty opowieści ułożone w dziesięciu podkatalogach odpowiadających typom stron ([ADR 0003](../docs/decisions/0003-jeden-typ-na-katalog.md), [ADR 0004](../docs/decisions/0004-opowiesc-przed-mechanika.md)):

- `rozdzialy/` (`typ: rozdzial`) — Prolog, Pieśni (*Canto*), *Intervalla*,
- `epizody/` (`typ: epizod`) — zwarte odcinki podróży wewnątrz rozdziałów,
- `sceny/` (`typ: scena`) — pojedyncze wydarzenia z dosłownym zapisem `:::zapis` i analizą,
- `watki/` (`typ: watek`) — nici fabularne i zagadki biegnące przez sceny,
- `postacie/` (`typ: postac`) — osoby spotkane w opowieści,
- `organizacje/` (`typ: organizacja`) — Skrzydła, Zrzeszenia, Syndykaty, Biura i oddziały,
- `dzielnice/` (`typ: dzielnica`) — Dzielnice Miasta, Gniazda, Zaułki i rubieże,
- `miejsca/` (`typ: miejsce`) — konkretne miejsca akcji,
- `pojecia/` (`typ: pojecie`) — hasła świata: zjawiska, istoty, technologie, przedmioty, odbicia lustrzane i wydarzenia,
- `konteksty/` (`typ: kontekst`) — dzieła literackie, poematy, mity i pojęcia kulturowe,
- `co-nowego.md` — dziennik nowych przyrostów opowieści.

Pełna specyfikacja pól i warstw pochodzenia znajduje się w [`docs/guides/SCHEMAT_DANYCH.md`](../docs/guides/SCHEMAT_DANYCH.md).
