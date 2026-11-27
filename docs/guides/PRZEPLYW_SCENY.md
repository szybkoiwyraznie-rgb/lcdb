# Przepływ obróbki dostawy (`docs/guides/PRZEPLYW_SCENY.md`)

Przewodnik krok po kroku pokazujący, jak w kolejnych sesjach przetwarzać nowe porcje rozegranej historii **Limbus Company** — bez utraty szczegółów, bez naruszenia dosłowności i bez ryzyka spoilera.

---

## 1. Postacie dostaw od właściciela

Nowy materiał od właściciela może przyjść w jednej lub kilku postaciach:

1. **Czytanki fabularne** (wklejone w czacie lub udostępnione na Dysku Google, np. pliki z `czytanki_EN` / polskie przekłady rozdziałów) — zawierają nagłówek rozdziału, czas i miejsce (`*rok 984-01 · D Corp. · District 4*`), etapy (`### Etap 0-1`), identyfikatory węzłów (`<!-- S001B -->`), znaczniki `*— Przed walką —*` / `*— Po walce —*`, kwestie mówców oraz mowę zegara Dantego `\<…>`.
2. **Archiwa zbieracza danych gry** (`LC_DANE_<data>_<id>.zip` z Dysku Google) — zawierają raporty zmian SHA-256 i surowe pliki lokalizacyjne (`StoryData`, `PersonalityVoice`, `AbnormalityGuides`, `DanteNote`, `EGOVoice`).
3. **Karty Grzeszników, Tożsamości ze Światów Lustrzanych (*Identities*) oraz *E.G.O*** — zawierają akta więźnia, opowieści Tożsamości i wypowiedzi postaci obok tabelek bojowych.
4. **Zrzuty ekranu, własne notatki właściciela lub pytania interpretacyjne.**

### Żelazna reguła pracy z paczkami na Dysku Google
Paczka na Dysku Google (np. zbiór wszystkich 36 czytanek albo pełny zrzut `LC_DANE_*.zip`) niemal zawsze zawiera pliki wybiegające daleko poza miejsce, do którego właściciel dotarł w grze!
- Pobieraj i rozpakowuj paczki **wyłącznie w `/tmp/...` poza drzewem repozytorium** (a jeśli konektor zapisze plik w `google_drive/`, natychmiast przenieś go do `/tmp/` i usuń `google_drive/`).
- Otwieraj **wyłącznie** pliki odpowiadające rozdziałom i etapom, które właściciel jawnie wskazał jako rozegrane. Nie przeglądaj przyszłych plików „dla kontekstu”.

---

## 2. Pierwsza prawdziwa dostawa — usunięcie zaślepki technicznej

Jeśli w repozytorium wciąż znajduje się startowa zaślepka techniczna (`rozgrywka/zapisy/zaslepka-001.md` i karty z tagiem `zaslepka`):

1. Wypisz wszystkie pliki zaślepki:
   ```bash
   grep -rl zaslepka content/ rozgrywka/
   ```
2. Usuń `rozgrywka/zapisy/zaslepka-001.md` oraz wszystkie 11 startowych kart zaślepki z `content/*/`.
3. Zastąp treść `content/co-nowego.md` pierwszym prawdziwym wpisem z podróży i ustaw `rozgrywka/postep.json` na ostatnią scenę pierwszej dostawy.

---

## 3. Siedem kroków obróbki każdej porcji scen

### Krok 1 — Zarchiwizuj surowy zapis w `rozgrywka/zapisy/`
- Zapisz rozegrany tekst w `rozgrywka/zapisy/RRRR-MM-DD-<nr>-<slug>.md` dokładnie w brzmieniu źródłowym (nie poprawiaj literówek oryginału, nie usuwaj `<!-- S001B -->` ani `\<…>`).
- Jeżeli dostawa jest po angielsku lub koreańsku, w `rozgrywka/zapisy/` i w blokach `:::zapis` trzymaj **dosłowny oryginał dostawy**, natomiast tytuł karty, `streszczenie`, podsekcje `###`, `## Analiza` i karty encji pisz po polsku (cytując kluczowe zwroty i podając `tytul_en` / `tytul_kr`). Jeżeli właściciel dostarczył polską czytankę — cały `:::zapis` jest w tym przekładzie.

### Krok 2 — Wyznacz granice scen (wydarzenie, nie węzeł techniczny)
- Przeczytaj zarchiwizowany fragment i podziel go na **wydarzenia fabularne** (wspólne miejsce, ciągły czas, jedna rozmowa lub konfrontacja — ADR 0009).
- Drobne węzły przed walką i po walce rozgrywające się w tym samym miejscu łącz w jedną kartę `scena`, rozdzielając jej etapy czytelnymi podsekcjami `###` wewnątrz `## Treść sceny`.
- Nadaj każdej nowej scenie kolejny, ciągły `kolejnosc` (`N + 1`, `N + 2`, …).

### Krok 3 — Utwórz karty scen, epizodu i rozdziału
- W `content/rozdzialy/` utwórz lub uzupełnij rozdział (`numer`, `oznaczenie`, `rodzaj_rozdzialu`, `czas_akcji`).
- W `content/epizody/` utwórz lub uzupełnij epizod (`rozdzial`, `kolejnosc`, `rodzaj`).
- W `content/sceny/<slug>.md`:
  - w `## Treść sceny` wstaw warstwę `{{dostawa` z podsekcjami `###` i dosłownymi blokami `:::zapis`,
  - w `## Analiza` opisz przebieg, stawki, relacje i nowe poszlaki w `{{opracowanie` (z parami `sekcje_analizy: ["Podsekcja analizy → Podsekcja treści"]`), a otwarte pytania wyodrębnij w osobnej warstwie `{{model pewnosc=NN pytanie="…"}}`,
  - jeśli w scenie pobrzmiewa wyraźne echo literackie lub kulturowe, dodaj sekcję `## Nawiązania literackie i kulturowe` (`{{kwerenda` ze `{{zrodlo …}}` lub `{{model`).

### Krok 4 — Zaktualizuj graf encji świata i wątków
Przejrzyj każdą postać, frakcję, dzielnicę, miejsce, pojęcie i wątek występujące w nowych scenach:
- Dla nowych bytów załóż karty we właściwych katalogach (`postacie/`, `frakcje/`, `dzielnice/`, `miejsca/`, `pojecia/`, `watki/`, `konteksty/`).
- Dla istniejących kart dopisz nowe fakty potwierdzone w scenie (w `{{dostawa` lub `{{opracowanie`), nie kasując wiedzy o tym, jak postać lub zjawisko wyglądało wcześniej.
- Przy materiałach pozadialogowych (*Notatki Dantego*, *Logi obserwacyjne Anomalii*, *Akta Grzeszników*, *Opowieści Tożsamości ze Światów Lustrzanych*, *E.G.O*) wydobądź biografię, prawa świata i symbolikę, **odrzucając wszelką mechanikę liczbową** (ADR 0013).

### Krok 5 — Zrewiduj dotychczasowe hipotezy (`interpretacje:`)
Sprawdź widoki powiązanych postaci i wątków (`wszystkieHipotezy`):
- Jeśli nowa scena rozstrzygnęła, zawęziła lub obaliła wcześniejszy blok `{{model pewnosc=…}}`, najpierw przekopiuj jego **dosłowne dotychczasowe brzmienie** do listy `interpretacje:` we frontmatterze (`data: "RRRR-MM-DD GG:MM"`, `fragment: "<Tytuł sekcji ##>"`, `zmiana: "…"`, `pewnosc_poprzedniego: …`, `poprzednio: |`), a dopiero potem zaktualizuj treść sekcji (ADR 0007).
- Zawsze zadaj sobie pytanie kontrolne: *czy ten wniosek wynika z poznanych dotąd scen, czy podpowiada mi go zewnętrzna pamięć o dalszych losach tej postaci?* Jeśli to drugie — usuń go bez wahania (ADR 0006).

### Krok 6 — Przesuń granicę fabuły i dopisz dziennik
- Ustaw `ostatnia_scena` w `rozgrywka/postep.json` na slug ostatniej opracowanej sceny.
- Dopisz na samej górze `content/co-nowego.md` nową sekcję `## RRRR-MM-DD — <Tytuł odsłony>` z wikilinkami do nowych scen, postaci i wątków (czystym językiem opowieści, bez słów „baza”, „dostawa”, „wpis”!).

### Krok 7 — Przepuść wszystkie bramy i wypchnij commit
```bash
npm test
npm run zapis
npm run build
```
Sprawdź w oknie `npm run zapis`, czy w opracowanym pliku z `rozgrywka/zapisy/` nie zostały przypadkiem pominięte wiersze dialogu lub narracji (pokrycie liczone jest **wierszami**, bo czytanki zapisują całe ciągi kwestii bez pustych linii — `niepokryteWierszeZapisu`). Po pełnym opracowaniu archiwum narzędzie wypisuje `✓ … każdy wiersz archiwum należy do którejś sceny`. Gdy komplet bram świeci na zielono — zrób commit i natychmiast `git push`.
