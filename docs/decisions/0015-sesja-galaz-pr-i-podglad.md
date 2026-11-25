# 0015. Rytuał sesji: jedna sesja = jedna gałąź = jeden PR, stały podgląd na żywo i audyt poprzednika

Status: przyjęta (2026-11-25)

## Kontekst

Kronika jest rozwijana przyrostowo przez kolejne, niezależne sesje agentów AI. Bez ścisłego protokołu przekazywania pracy pojedyncza sesja mogłaby zostawić niesprawdzone usterki po poprzedniku, nie uruchomić podglądu dla właściciela, gromadzić zmiany bez pushowania aż do limitu czasu albo przedwcześnie scalić PR bez przeglądu właściciela.

## Decyzja

1. Każda sesja pracuje wyłącznie na przypisanej jej gałęzi roboczej i otwiera dla niej dokładnie jeden Pull Request do `main` (`1 sesja = 1 gałąź = 1 PR`), już na etapie planu sesji.
2. Krok `0` każdej sesji to uruchomienie stałego procesu `npm run serve` na `0.0.0.0:3000` (`Live Preview`), który pozostaje żywy do końca sesji i jest odświeżany przez `npm run build`.
3. Przed przystąpieniem do nowych zmian każda sesja przeprowadza i raportuje w opisie PR-a trzyczęściowy audyt ostatniego scalonego PR-a: **(3a) merytoryczny**, **(3b) kodu i testów**, **(3c) pozostałych zmian**.
4. Każdy domknięty, zielony krok (`npm test && npm run zapis && npm run build`) jest osobnym commitem natychmiast wypychanym na `origin`.
5. Agentowi **nigdy nie wolno** scalać ani zamykać PR-a — scalenia dokonuje wyłącznie właściciel (metodą *Squash*).

## Konsekwencje

- Każda kolejna sesja wzajemnie kontroluje poprzednią, praca jest bezpiecznie zapisywana na zdalnej gałęzi po każdym zielonym kroku, a właściciel ma stały podgląd na żywo i pełną kontrolę nad gałęzią `main`.
