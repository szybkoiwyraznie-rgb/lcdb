# Archiwum rozgrywki i granica fabuły (`rozgrywka/`)

Katalog przechowuje surowe dowody z rozgrywki właściciela oraz wskaźnik postępu opowieści:

- `postep.json` — wskazuje w polu `ostatnia_scena` slug ostatniej rozegranej i opracowanej sceny ([ADR 0008](../docs/decisions/0008-granica-fabuly.md)). Żadna karta sceny o wyższym polu `kolejnosc` nie przejdzie budowania.
- `zapisy/` — niemodyfikowalne archiwa surowego zapisu rozgrywki (`<RRRR-MM-DD>-<nr>.md`). Każdy blok `:::zapis` na karcie `content/sceny/*.md` musi być dosłownym podciągiem wskazanego pliku archiwum (`npm run zapis`).

Procedura przyjęcia nowej dostawy (w tym oczyszczenia startowego materiału `zaslepka` przy pierwszej prawdziwej dostawie) znajduje się w [`docs/guides/PRZEPLYW_SCENY.md`](../docs/guides/PRZEPLYW_SCENY.md).
