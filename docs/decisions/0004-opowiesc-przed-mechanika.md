# ADR 0004: Fabuła przed mechaniką — dziesięć typów stron świata i historii

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

*Limbus Company* łączy rozbudowaną opowieść o podróży przez Miasto z taktyczną walką turową i systemem pozyskiwania wariantów bojowych. Mieszanie kart fabularnych z mechaniką (monetami, obrażeniami, pasywami, walutami, banerami losowań) zamieniłoby kronikę w podręcznik rozgrywki i rozbiło spójność lektury.

## Decyzja

1. Schemat kroniki obejmuje wyłącznie **dziesięć typów narracyjnych**:
   - przebieg opowieści: `rozdzial` (`content/rozdzialy/`), `epizod` (`content/epizody/`), `scena` (`content/sceny/`), `watek` (`content/watki/`),
   - ludzie i świat Miasta: `postac` (`content/postacie/`), `organizacja` (`content/organizacje/`), `dzielnica` (`content/dzielnice/`), `miejsce` (`content/miejsca/`), `pojecie` (`content/pojecia/`),
   - warstwa odniesień: `kontekst` (`content/konteksty/`).
2. Nie powstają karty umiejętności, monet, poziomów trudności, etapów lochów ani stopni rzadkości.

## Konsekwencje

- Nawigacja główna i kafelki strony startowej odzwierciedlają wyłącznie porządek opowieści i świata Miasta.
- Materiały towarzyszące z gry (akta, opowieści ze Światów Lustrzanych, dzienniki Abominacji, *Zapiski Dantego*) trafiają do właściwych kart narracyjnych zgodnie z [ADR 0016](0016-akta-lustra-i-zapiski-to-lore.md).
