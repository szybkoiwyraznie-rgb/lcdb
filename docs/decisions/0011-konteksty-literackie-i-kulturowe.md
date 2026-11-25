# ADR 0011: Konteksty literackie i kulturowe jako osobna warstwa bez wyprzedzania fabuły

- **Status:** przyjęta
- **Data:** 2026-11-25

## Kontekst

*Limbus Company* szczególnie mocno opiera swoje postacie, rozdziały i symbolikę na dziełach literatury światowej i koreańskiej, mitologii oraz filozofii (*Boska komedia*, *Przemiana*, *Zbrodnia i kara*, *Faust*, *Don Kichot*, *Odyseja*, *Obcy*, *Wichrowe Wzgórza*, *Moby Dick*, *Skrzydła* Yi Sanga i wiele innych). Jednocześnie twórcy gry swobodnie przekształcają pierwowzory, a streszczanie zakończenia powieści przed rozegraniem poświęconej jej Pieśni zdradzałoby tropy fabularne.

## Decyzja

1. Zewnętrzne dzieła, mity i pojęcia otrzymują własny typ karty `kontekst` (`content/konteksty/`), oddzielony od bytów wewnętrznych świata Miasta (`pojecie`).
2. Kartę `kontekst` zakładamy dopiero wtedy, gdy rozegrana scena lub dostarczone akta wyraźnie przywołują dane imię, cytat, epitet lub motyw.
3. Opis w `content/konteksty/` omawia **wyłącznie te elementy pierwowzoru, które zostały już uruchomione w rozegranym materiale**, opierając fakty o dziele na warstwie `{{kwerenda` z przypisem `{{zrodlo …}}` (lub ostrożnym `{{model`), nigdy nie używając fabuły książki do zapowiadania przyszłych zwrotów akcji w grze.

## Konsekwencje

- Konteksty literackie wzbogacają lekturę dotychczasowych scen, nie zamieniając się w ukryte spoilery dalszych rozdziałów.
