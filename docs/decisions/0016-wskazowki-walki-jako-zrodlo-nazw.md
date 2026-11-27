# 0016. Wskazówki towarzyszące walce: osobne archiwum, z którego bierzemy tylko nazwy i obrazy świata

Status: przyjęta (2026-11-27)

## Kontekst

W grze, obok dialogów, pojawiają się objaśnienia sterowania walką (w dostawie LC_0_1: jak wydawać rozkazy na „panelu dowodzenia”). W większości to czysta mechanika, którą kronika pomija (ADR 0004, 0012, 0013 p. 3). Zdarza się jednak, że to właśnie one pierwsze nazywają rzeczy świata. W Etapie 0-1 fabuła ani razu nie nazywa siedmiorga z autobusu Grzesznikami, a Dantego Kierownikiem — robią to dopiero wskazówki. Ich obrazy (łańcuch przeciągany między zębatkami) zbiegają się przy tym z obrazami fabuły (łańcuchy kontraktu, zegarowa głowa).

Właściciel zdecydował: wskazówki przekazujemy w dostawach, oddzielone od fabuły.

## Decyzja

1. **W dostawie** wskazówki są wyraźnie oddzielone od fabuły: osobnym plikiem (np. `LC_0_1_wskazowki.txt`) albo znacznikiem `*— Wskazówki —*` przed blokiem. Obowiązuje ta sama granica spoilerów co dla fabuły — tylko rozegrane etapy.
2. **Archiwum:** wskazówki zapisujemy dosłownie w osobnym pliku `rozgrywka/zapisy/RRRR-MM-DD-<nr>-<slug>-wskazowki.md` (nazwa kończy się na `-wskazowki.md`). Archiwum wskazówek:
   - nie jest podstawą żadnej sceny — scena wskazująca je w `zapis:` zatrzymuje build (`sprawdzWiernoscSceny`);
   - nie podlega kontroli pokrycia — `npm run zapis` wypisuje je jako „archiwum wskazówek, poza pokryciem scen”.
3. **Co bierzemy:** wyłącznie nazwy, tytuły i obrazy świata (kto jak jest nazywany, kto komu wydaje rozkazy, powtarzające się motywy). Fakty te piszemy w `{{opracowanie}}` z jawnym wskazaniem źródła („w objaśnieniach towarzyszących pierwszemu starciu…”), a zbieżności obrazów — w `{{model pewnosc=…}}`.
4. **Czego nie bierzemy:** sterowania i mechaniki („naciśnij”, „przytrzymaj”, „połącz umiejętności”, „linia pomocnicza”, panele, przyciski). Dosłowny cytat ze wskazówek w `:::zapis` na karcie wolno umieścić tylko wtedy, gdy zdanie nie zawiera słownictwa mechaniki.
5. **Hierarchia:** wskazówki są słabszym źródłem niż dialog i narracja. Jeśli fabuła powie później coś innego, wygrywa fabuła, a wcześniejszy wniosek przechodzi do `interpretacje:` (ADR 0007).

## Konsekwencje

- Kronika może używać nazw, które świat gry nadaje bohaterom, zanim padną w dialogu — z czytelnym zaznaczeniem, skąd pochodzą.
- Mechanika nadal nie przecieka do treści: brama języka (ADR 0012) obejmuje wszystko poza `:::zapis`, a wybór cytatów ogranicza p. 4.
- Archiwum zachowuje komplet dostawy, więc późniejsza sesja może wrócić do wskazówek, gdy fabuła nada im nowy sens.
