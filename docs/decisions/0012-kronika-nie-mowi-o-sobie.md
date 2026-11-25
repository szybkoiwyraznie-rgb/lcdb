# 0012. Kronika nie mówi o sobie ani żargonem mechanicznym — automatyczna brama języka

Status: przyjęta (2026-11-25)

## Kontekst

Kronika tworzona przez kolejne sesje agentów łatwo nasiąka żargonem warsztatowym („w tej bazie”, „w najnowszej dostawie właściciel przesłał plik”, „dodano wpis”) albo językiem gry jako programu („gracz klika na ekranie”, „postać z banera gacha po Uptie III zadaje obrażenia ze skilla 2”). Oba rejestry niszczą spójność czytelniczą dziennika podróży.

## Decyzja

1. Cały widoczny tekst kroniki (karty w `content/`, dziennik `content/co-nowego.md`, opisy widoków i przewodnik `#/o-bazie`) pisany jest z wnętrza świata opowieści i refleksji literackiej.
2. Zestaw `test/jezyk.test.js` renderuje wszystkie trasy kroniki, wycina z nich dosłowne cytaty źródłowe `<div class="zapis-tekst">` i sprawdza widoczny tekst pod kątem zakazanych wyrażeń meta, technicznych i growo-mechanicznych. Naruszenie przerywa `npm test` oraz CI.

## Konsekwencje

- Styl kroniki pozostaje jednolity niezależnie od tego, ile kolejnych sesji dopisuje nowe rozdziały.
