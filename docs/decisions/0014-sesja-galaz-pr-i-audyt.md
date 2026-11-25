# ADR 0014: Jedna sesja, jedna gałąź, jeden PR, stały podgląd i obowiązkowy audyt

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

Kronikę rozwija sztafeta niezależnych sesji agentowych, z których każda widzi wyłącznie stan repozytorium na GitHubie i wiadomość startową właściciela. Bez ścisłego rytuału sesyjnego łatwo o utratę pracy przy resecie kontenera, przeoczenie błędów poprzedniej sesji albo przedwczesne zamknięcie PR-a.

## Decyzja

1. Obowiązuje zasada **1 sesja = 1 gałąź `arena/…` = 1 Pull Request** do `main`.
2. Sesja startuje w kolejności: `(0)` uruchomienie stałego serwera podglądu na `0.0.0.0:3000` przez `start_process` → `(1)` otwarcie PR-a z planem → `(2)` lektura dokumentacji i lekcji → `(3)` trójczęściowy audyt poprzedniego scalonego PR-a (`3a` merytoryczny, `3b` kodu, `3c` pozostałych zmian) zapisywany w `docs/audits/` → `(4)` pętla sceny albo pętla jakości.
3. Agent commitowuje i wypycha zmiany po każdym zielonym kroku, utrzymuje aktualny opis PR-a i **nigdy sam nie scala ani nie zamyka PR-a**.

## Konsekwencje

- Każda sesja ma podwójną kontrolę jakości: własne bramy automatyczne przed pushem oraz niezależny audyt wykonany na początku następnej sesji.
