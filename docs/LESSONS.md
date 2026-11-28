# Sprawdzone lekcje i pułapki (`LESSONS.md`)

Ten plik zbiera wnioski z prowadzenia bliźniaczych kronik (`wwm`, `srw`) oraz specyficzne pułapki świata **Limbus Company**. Dopisuj tu wyłącznie reguły, które zapobiegają powtarzalnym klasom błędów.

---

## 1. Pułapki merytoryczne i bezspoilerowe

### 1.1. Zakaz „proroczych hipotez” z pamięci modelu o przyszłych Pieśniach
- **Pułapka:** Model zna dalsze Pieśni (*Canto*), wiki *Limbus Company*, *Library of Ruina* i *Lobotomy Corporation* oraz zakończenia powieści pierwowzorów (np. *Skrzydeł* Yi Sanga, *Przemiany* Kafki, *Zbrodni i kary*, *Demiana*, *Moby Dicka*, *Wichrowych Wzgórz*, *Don Kichota*, *Snu czerwonego pawilonu*, *Obcego*, *Pieśni o Rolandzie*, *Odysei*). Pokusa, by zapisać przyszły zwrot fabularny jako rzekomą hipotezę `{{model pewnosc=45}}`, niszczy sens kroniki równie skutecznie jak jawny spoiler.
- **Zasada:** Hipoteza `{{model pewnosc=NN}}` może wynikać **wyłącznie z przesłanek obecnych w rozegranych dotąd scenach**. Jeśli wniosek nie da się obronić wskazanym zdaniem lub detalem z poznanych scen, nie wolno go pisać — niezależnie od podanego procentu pewności (ADR 0006, 0008).

### 1.2. Pierwowzór literacki oświetla teraźniejszość sceny, nie przyszłość postaci
- **Pułapka:** Streszczanie całej fabuły pierwowzoru literackiego w karcie `konteksty/` zdradza strukturę przyszłego *Canto* danego Grzesznika.
- **Zasada:** W `content/konteksty/` opisuj wyłącznie te motywy, cytaty, imiona i obrazy pierwowzoru, które **już pojawiły się** w rozegranych scenach (np. epigraf rozdziału, herb i dewiza Grzesznika, konkretny dialog). Gdy w późniejszym rozdziale dojdą nowe wątki literackie, rozbuduj kartę kontekstu dopiero wtedy (ADR 0011).

### 1.3. Paczki z Dysku Google zawierają więcej niż rozegrano
- **Pułapka:** Paczki pomocnicze na Dysku Google (np. archiwa zbieracza `LC_DANE_*.zip` albo zbiory czytanek) obejmują wszystkie pliki obecne w instalacji gry, także nierozpoczęte rozdziały.
- **Zasada:** Rozpakowuj paczki wyłącznie w katalogu tymczasowym poza repozytorium (`/tmp/...`) i otwieraj **tylko** te pliki, które właściciel jawnie wskazał jako rozegrane w danej dostawie. Nigdy nie indeksuj ani nie kopiuj hurtem reszty paczki.

### 1.4. Karty Tożsamości (*Identities*) i *E.G.O* mają dwie warstwy — bierzemy tylko opowieść
- **Pułapka:** Pliki profilowe Grzeszników i Tożsamości łączą akta biograficzne, monologi i opowieści ze Światów Lustrzanych (*Uptie Story*) z tabelkami statystyk, odporności, monet i obrażeń.
- **Zasada:** Do kroniki trafia wyłącznie warstwa fabularna i światotwórcza (biografie, relacje z organizacjami w Światach Lustrzanych, natura *E.G.O* i Anomalii). Liczby obrażeń, rzuty monetą, sloty umiejętności i żargon ulepszeń pomijamy całkowicie — ich obecność złapie `test/jezyk.test.js` (ADR 0012, 0013).

### 1.5. Scena to wydarzenie fabularne, nie techniczny węzeł `S001B`
- **Pułapka:** Pliki gry dzielą rozdział na dziesiątki drobnych węzłów *przed walką* i *po walce* (`<!-- S001B -->`, `<!-- S001A -->`), czasem liczących po dwa zdania. Tworzenie osobnej strony sceny dla każdego węzła poszatkowałoby kronikę na nieczytelne okruchy.
- **Zasada:** Jedna karta w `content/sceny/` obejmuje **jedno spójne wydarzenie** (wspólne miejsce, czas i ciąg rozmowy — często łącząc część przed starciem i po starciu w dwie podsekcje `###` wewnątrz `## Treść sceny`). Brama `MIN_ELEMENTOW_SCENY = 4` blokuje mikrosceny (ADR 0009).

### 1.5a. Część „po walce” bywa osobnym wydarzeniem — wtedy dziel etap na sceny `a`/`b`
- **Pułapka:** Mechaniczne łączenie całego etapu w jedną kartę (bo „to samo miejsce”) daje kolosa, w którym dwie różne konfrontacje mieszają się w jednej analizie. W LC_0_1 część przed walką kończy się kontraktem i rozkazem, a część po walce to klęska przybyszów i interwencja nowej postaci.
- **Zasada:** Gdy po znaczniku `*— Po walce —*` zaczyna się nowe rozstrzygające wydarzenie, utwórz drugą scenę z numerem z literą (`0-1a`, `0-1b` — sortowanie `Intl.Collator` z `numeric: true` porządkuje je poprawnie). Krótkie węzły nadal łączymy (1.5).

### 1.5b. Skrót karty encji na kafelku pochodzi z opracowania, nie z cytatu
- **Pułapka:** Karta zaczynająca się od `{{dostawa` z wielowierszowym `:::zapis` dawała na liście sklejony, nieczytelny skrót z surowymi znacznikami (`:::zapis Pantera: …`), a test integralności zgłaszał „niewyrenderowany blok :::zapis”.
- **Zasada:** `wytnijStreszczenieZBlokow` (w `tools/build.mjs`) bierze najpierw warstwy `{{opracowanie` z boksu `## Opis` i wycina bloki `:::zapis`. Cytat otwierający kartę może więc stać na początku — skrót i tak powstanie z akapitu opracowania.

### 1.6. Rewizja hipotezy wymaga `interpretacje:` z dosłownym `poprzednio`
- **Pułapka:** Nadpisanie starego bloku `{{model pewnosc=…}}` nowym wnioskiem bez śladu kasuje pamięć o tym, jak opowieść zwodziła lub odsłaniała karty.
- **Zasada:** Przed zmianą merytoryczną interpretacji skopiuj jej dotychczasowe brzmienie **słowo w słowo** do pola `interpretacje:` (`fragment: <tytuł sekcji ##>`, `poprzednio: |`). Silnik sam wyrenderuje pod tą sekcją zwijany blok *Poprzednia wersja* (ADR 0007).


### 1.6a. Jedna hipoteza — jedna karta
- **Pułapka:** To samo pytanie `{{model pewnosc=…}}` zapisane naraz w analizie sceny i na karcie wątku pojawia się w widoku `#/hipotezy` dwa razy. Przy następnej rewizji łatwo poprawić tylko jedną kopię.
- **Zasada:** Hipotezę zapisuj raz, na karcie, której dotyczy najszerzej (zwykle wątek albo pojęcie). Scena odsyła do niej wikilinkiem w `{{opracowanie}}`. Przykład: wycie głodnego Mefiego żyje tylko w wątku `czego-laknie-mephistopheles`.

### 1.7. Wskazówki walki: nazwy tak, mechanika nie
- **Pułapka:** Objaśnienia sterowania wyglądają na czystą mechanikę i łatwo je wyrzucić w całości — a to w nich po raz pierwszy padają nazwy „Grzesznicy” i „Kierownik”, których dialog Etapu 0-1 nie używa. Odwrotny błąd: wkleić je do treści sceny, razem z „panelem dowodzenia” i „umiejętnościami”.
- **Zasada:** Archiwizuj je osobno (`…-wskazowki.md`), nie wiąż z żadną sceną, a do kart przenoś tylko nazwy, tytuły i obrazy — z jawnym źródłem w zdaniu i z pierwszeństwem fabuły, gdy ta powie coś innego (ADR 0016).
- Bywa, że wskazówki etapu to sama mechanika (Etap 0-2: Starcia i Monety; Etap 0-3: Poczytalność, Oszołomienie, Panika). Wtedy archiwizujemy je w całości i nie przenosimy na karty niczego.

### 1.8. Akta Grzeszników to nie scena i nie wskazówki
- **Pułapka:** Akta przychodzą w tym samym pliku co fabuła etapu, więc kusi, żeby dokleić je do sceny (choć nikt ich w scenie nie czyta) albo potraktować jak wskazówki i zostawić poza kroniką. Drugi błąd: streścić je głosem kroniki, jakby oceny firmy były faktami.
- **Zasada:** Archiwizuj je osobno (`…-akta.md`), cytuj każdy wiersz dosłownie na karcie postaci w `## Akta Grzesznika`, a w opracowaniu pisz „według akt…”. Numer z akt idzie do `numer_grzesznika`. Gdy akta wymuszają zmianę wcześniejszego wniosku (np. roli postaci), zapisz ją w `interpretacje:` (ADR 0017).
---

## 2. Pułapki techniczne silnika i środowiska

### 2.1. Konwencje zapisu Limbus Company w `:::zapis`
- W blokach `:::zapis` wklejaj tekst z `rozgrywka/zapisy/*.md` **bez żadnych poprawek** (nawet razem z `<!-- S001B -->` i `\<…>`).
- Renderer sam ukrywa komentarze `<!-- … -->` i zdejmuje backslash sprzed nawiasów mowy zegara Dantego (`\<…>` → `<…>`), natomiast `sprawdzWiernoscSceny` porównuje surową zawartość `:::zapis` z plikiem archiwum. Ręczne skasowanie komentarza lub `\` w `:::zapis` bez zmiany archiwum zerwie dosłowność podciągu!
- **Słowa zatarte `***`** (np. `**Ja** (***): … gdy ryję ***…`) to część opowieści — wymazane fragmenty pamięci Dantego. Renderer chroni każde samodzielne `***` (`ZATARTE_RE`) przed regułami pogrubienia i kursywy i wyświetla je jako wyciszone `<span class="zatarte">`; wcześniej dwa takie miejsca w jednej linii sklejały się w fałszywe `<strong>`/`<em>`. Nie zamieniaj ich na `\*\*\*` ani inne znaki.

### 2.1a. Czytanki mają dialog bez pustych linii i końce linii CRLF
- Polskie czytanki z Dysku Google zapisują cały etap przed starciem jako jeden ciąg kwestii oddzielonych pojedynczym `\n` i przychodzą z końcami linii `\r\n`. Przy archiwizacji w `rozgrywka/zapisy/` zamieniamy wyłącznie `CRLF → LF` (wymóg `.gitattributes`; porównanie dosłowności i tak normalizuje białe znaki) — żadnych innych zmian.
- Ten sam ciąg kwestii wolno pociąć na kilka bloków `:::zapis` w kolejnych podsekcjach `###` lub w dwóch scenach. Pokrycie archiwum `npm run zapis` liczy się wierszami (`niepokryteWierszeZapisu`), więc cięcie w środku „akapitu” nie daje fałszywych alarmów.

### 2.2. Kreska pionowa `|` w tabelach markdown i wikilinkach
- Wewnątrz tabeli markdown wikilink z etykietą `[[slug|etykieta]]` działa bez uciekania, bo `podzielKomorki` rozpoznaje parę `[[…]]`. Zwykły znak `|` w tekście komórki poprzedź ukośnikiem `\|`.

### 2.3. Jeden wspólny zasięg sklejonego JS w `dist/index.html`
- `tools/build.mjs` skleja wszystkie moduły `src/lcdb/*.js` w jeden skrypt przeglądarkowy. Dwie funkcje lub stałe o tej samej nazwie na najwyższym poziomie dwóch modułów wywołają twardy błąd `assertNoNameCollisions`, a cykliczny import — błąd `collectModules`. Trzymaj pomocniki dat w `czas.js`, a unikalne nazwy pomocników lokalnych poprzedzaj kontekstem modułu.

### 2.4. Płytki klon Gita (`shallow clone`) gubi daty kart
- Na starcie świeżej sesji środowisko klonuje repozytorium płytko (`--depth=1`). Zawsze sprawdzaj `git rev-parse --is-shallow-repository` i w razie `true` wykonaj `git fetch --unshallow` przed pierwszym buildem.

### 2.5. Podgląd na żywo czyta `dist/`, a brakujący `/data/*.json` daje 404
- Po każdej edycji plików w `content/` uruchom `npm run build` — w przeciwnym razie nowa karta istnieje w indeksie lub kodzie, lecz przeglądarka dostanie `404` przy próbie pobrania `data/<slug>.json`.

### 2.6. Części tytułowe (`.naglowek-strony`, `.hero`) wypełniają pełną szerokość kontenera
- Nigdy nie nakładaj ograniczenia `max-width` w `ch` ani wąskich `px` na `.wstep`, `.hero-opis`, `.hero-szukaj` czy `.szukaj-formularz`, ani `display: inline-block` na `.hero-granica`. W układzie o szerokości `1240px` ograniczenie `72ch` / `540px` ściska całą część tytułową do lewej połowy ekranu i zostawia prawą połowę pustą. Szerokość wstępu i paska wyszukiwania zawsze wyznacza pełna szerokość kontenera (`max-width: none; width: 100%`).
