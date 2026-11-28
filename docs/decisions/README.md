# Rejestr decyzji architektonicznych (`docs/decisions/`)

Zapis kluczowych rozstrzygnięć technicznych, redakcyjnych i procesowych rządzących kroniką **Limbus Company** (`lcdb`).

Każda przyjęta decyzja pozostaje trwałą częścią historii projektu: jeśli późniejsze ustalenie zmienia wcześniejszą zasadę, tworzymy nowy plik `00NN-*.md`, a w starszym zmieniamy jedynie linię `Status:` na `zastąpiona przez 00NN`.

---

## Spis decyzji

| Nr | Decyzja | Status |
|---|---|---|
| [0001](0001-powloka-i-drzewo-danych.md) | Powłoka HTML ze spakowanym indeksem i leniwe drzewo danych `dist/data/` | przyjęta (2026-11-25) |
| [0002](0002-wlasny-markdown-i-zero-zaleznosci.md) | Własny parser frontmattera i markdownu, Node ≥ 22, zero zależności zewnętrznych | przyjęta (2026-11-25) |
| [0003](0003-jeden-typ-na-katalog.md) | Jeden typ karty na katalog i zamknięty słownik pól ze swobodą sekcji oraz motywów | przyjęta (2026-11-25) |
| [0004](0004-opowiesc-przed-mechanika.md) | Opowieść przed mechaniką: dziesięć fabułocentrycznych typów świata *Limbus Company* i układ 3:1 | przyjęta (2026-11-25) |
| [0005](0005-jeden-boks-wiele-warstw-pochodzenia.md) | Jeden boks z neutralnym tytułem i czterema kolorami pochodzenia informacji | przyjęta (2026-11-25) |
| [0006](0006-hipotezy-z-pewnoscia-bez-prorokowania.md) | Hipotezy z jawną pewnością `0–100%` oraz zakaz prorokowania z przyszłych Pieśni | przyjęta (2026-11-25) |
| [0007](0007-historia-interpretacji.md) | Zachowywanie zastąpionych odczytań w polu `interpretacje:` i renderowanie *Poprzedniej wersji* | przyjęta (2026-11-25) |
| [0008](0008-twarda-granica-fabuly.md) | Twarda granica poznanej fabuły w `rozgrywka/postep.json` | przyjęta (2026-11-25) |
| [0009](0009-scena-jedno-wydarzenie-i-wiernosc-zapisu.md) | Scena jako jedno wydarzenie fabularne i automatyczna kontrola dosłowności `:::zapis` | przyjęta (2026-11-25) |
| [0010](0010-relacje-jako-graf-dwukierunkowy.md) | Relacje encji jako automatycznie odwracany graf dwukierunkowy | przyjęta (2026-11-25) |
| [0011](0011-konteksty-literackie-i-kulturowe.md) | Konteksty literackie, mitologiczne i filozoficzne bez wyprzedzania losów Grzeszników | przyjęta (2026-11-25) |
| [0012](0012-kronika-nie-mowi-o-sobie.md) | Kronika nie mówi o sobie ani żargonem mechanicznym — automatyczna brama języka | przyjęta (2026-11-25) |
| [0013](0013-notatki-logi-i-swiaty-lustrzane-to-lore.md) | Notatki Dantego, logi Anomalii, akta Grzeszników i Światy Lustrzane jako materiał opowieści bez rachunków walki | przyjęta (2026-11-25) |
| [0014](0014-dziennik-i-jak-czytac-kronike.md) | Dziennik *Ostatnio opowiedziane* (`co-nowego.md`) oraz przewodnik *Jak czytać kronikę* | przyjęta (2026-11-25) |
| [0015](0015-sesja-galaz-pr-i-podglad.md) | Rytuał sesji: jedna sesja = jedna gałąź = jeden PR, stały podgląd na żywo i audyt poprzednika | przyjęta (2026-11-25) |
| [0016](0016-wskazowki-walki-jako-zrodlo-nazw.md) | Wskazówki towarzyszące walce: osobne archiwum, z którego bierzemy tylko nazwy i obrazy świata | przyjęta (2026-11-27) |
| [0017](0017-akta-grzesznikow-na-kartach-encji.md) | Akta Grzeszników: osobne archiwum, w całości zacytowane na kartach encji | przyjęta (2026-11-27) |
