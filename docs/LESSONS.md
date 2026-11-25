# Lekcje z pracy nad kroniką (`docs/LESSONS.md`)

Ten plik gromadzi konkretne błędy i pułapki zidentyfikowane w bliźniaczych kronikach właściciela (`wwm` i `srw`) oraz przystosowane do specyfiki *Limbus Company*. Dopisuj nową lekcję zawsze wtedy, gdy audyt lub praca w sesji ujawni powtarzalną pułapkę.

---

### L1. Zawsze przesuwaj `rozgrywka/postep.json` przed pierwszym buildem nowych scen
- **Pułapka:** Dodanie nowych kart `content/sceny/*.md` bez wcześniejszego uaktualnienia `ostatnia_scena` w `rozgrywka/postep.json` powoduje natychmiastowe odrzucenie budowania przez bramę granicy fabuły (`sprawdzGraniceFabuly`).
- **Zasada:** Aktualizacja `rozgrywka/postep.json` jest pierwszym krokiem po utworzeniu kart scen z nowej dostawy.

### L2. Kwestie zegarowe Dantego `<…>` wymagają ucieczkowania przed formatowaniem
- **Pułapka:** W *Limbus Company* główny bohater wypowiada swoje kwestie w nawiasach ostrych (`<…>`, `<O czym ty mówisz?>`). Naiwny renderer Markdown traktuje `<…>` jak nieznany znacznik HTML, przez co przeglądarka po cichu ukrywa całe wypowiedzi narratora.
- **Zasada:** `src/lcdb/markdown.js` ucieczkowuje `&`, `<`, `>`, `"` na samym wejściu przed jakimkolwiek podstawieniem znaczników; żadna zmiana silnika nie może odwrócić tej kolejności.

### L3. Zakaz pozorowanych hipotez z pamięci modelu o dalszych Pieśniach
- **Pułapka:** Model językowy zna dalsze rozdziały (*Canto*) z danych treningowych i łatwo ulega pokusie, by pod płaszczykiem „błyskotliwej hipotezy `pewnosc=45`” albo „niewinnej analogii literackiej” zdradzić prawdziwą tożsamość postaci, ukrytą zdradę lub finał wątku.
- **Zasada:** Każda hipoteza w `{{model pewnosc=…}}` oraz każdy opis w `content/konteksty/` musi opierać się wyłącznie na przesłankach widocznych do `ostatnia_scena`. Jeśli bez znajomości przyszłych rozdziałów dany wniosek nie nasuwałby się czytelnikowi tej sceny — jest spoilerem i nie wolno go zapisać.

### L4. Nie przypisuj postaciom organizacji ani ról spoza dostarczonego tekstu
- **Pułapka:** Nawet w neutralnym lub wczesnym materiale łatwo dopisać z pamięci, że dana postać należy do konkretnego Skrzydła, Syndykatu lub Zrzeszenia, zanim padło to w dialogu albo w dostarczonych aktach.
- **Zasada:** Pola `organizacja`, `dzielnica`, `numer_grzesznika` i `przydzial` wypełniamy wyłącznie na podstawie tego, co padło w dostarczonych scenach i materiałach towarzyszących.

### L5. Wnętrze `:::zapis` to dowód, nie streszczenie ani korekta redakcyjna
- **Pułapka:** Drobna poprawka przecinka, skrócenie dłużyzny albo ujednolicenie pisowni imienia w `:::zapis` zrywa zgodność z `rozgrywka/zapisy/*.md` i wywraca `npm run zapis` oraz `npm run build`.
- **Zasada:** Kopiuj fragmenty do `:::zapis` dosłownie z archiwum; wszelkie wyjaśnienia i ujednolicenia należą do sekcji `## Analiza` (`{{opracowanie`).

### L6. Boks ma zwykły tytuł z treści, a kolor należy wyłącznie do warstw w środku
- **Pułapka:** Kolorowanie samego nagłówka `<h2>` boksu albo dokładanie plakietki pochodzenia na poziomie `<section class="boks">` uniemożliwia połączenie w jednym boksie np. sprawdzonych źródeł (`kwerenda`) z wiedzą modelu (`model`).
- **Zasada:** `<section class="boks">` zaczyna się zawsze czystym `<h2>Tytuł</h2>`; barwy i plakietki niesie wyłącznie wewnętrzny `.fragment.poziom-<pochodzenie>`.

### L7. Hipoteza (`{{model pewnosc=…}}`) musi być fioletowa w całości, a tło `{{model}}` bez pewności — żółte
- **Pułapka:** Nadanie hipotezie fioletowej ramki przy pozostawieniu żółtego tła daje nieczytelny mieszaniec, a dopisanie `pytanie=` do zwykłego tła kulturowego bez `pewnosc=` udaje hipotezę bez oszacowania.
- **Zasada:** Atrybut `pewnosc=0..100` przełącza cały `.fragment` na klasę `rodzaj-interpretacja` (pełne fioletowe tło i obramowanie); blok `{{model` bez `pewnosc=` służy wyłącznie do tła kulturowego i nie przyjmuje `pytanie=`.

### L8. Każdy blok `{{kwerenda` musi mieć dowód tuż obok twierdzenia
- **Pułapka:** Wpisanie samego URL-a w polu `zrodla:` frontmattera nie pokazuje czytelnikowi, które zdanie z czego wynika i kiedy stronę odczytano.
- **Zasada:** Wewnątrz każdego bloku `{{kwerenda` wymagana jest dyrektywa `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`, renderowana bezpośrednio pod akapitem.

### L9. Bramy danych nie zastąpią bram na wyrenderowanym widoku
- **Pułapka:** Dane wejściowe mogą być poprawne schematycznie, a mimo to widok wygeneruje martwą kotwicę `#hip-…`, zduplikuje wstęp pod nagłówkiem albo powtórzy interpretację w bocznej kolumnie.
- **Zasada:** `test/integralnosc.test.js` oraz `test/trasy.test.js` renderują rzeczywiste widoki wszystkich typów stron i sprawdzają, że każda wewnętrzna kotwica `#…` ma odpowiadające `id="…"` w tym samym widoku.

### L10. Testy nie mogą zależeć na sztywno od slugów materiału zaślepkowego
- **Pułapka:** Wpisanie na stałe sluga `zaslepka-sc01` w testach silnika lub tras sprawia, że przy pierwszej prawdziwej dostawie (gdy zaślepka zostaje usunięta) połowa testów przestaje działać.
- **Zasada:** Testy pobierają pierwszą dostępną kartę danego typu dynamicznie z wczytanych danych albo budują własną miniaturową fiksturę w pamięci.

### L11. Odnośniki wewnątrz strony (`#kotwica` i `data-cel`) nie mogą nadpisywać `location.hash`
- **Pułapka:** Zwykły link `<a href="#boks-analiza">` w aplikacji z routingiem hashowym zamienia `#/scena/…` na `#boks-analiza`, przez co cofnięcie w przeglądarce lub odświeżenie gubi kartę.
- **Zasada:** Nasłuch kliknięć w `src/lcdb/main.js` przechwytuje `a[data-cel]` oraz gołe `a[href^="#"]:not([href^="#/"])` i przewija gładko przez `scrollIntoView`, a `router.js` traktuje gołą kotwicę jako skok bez przebudowy widoku.

### L12. Serwer podglądu musi zwracać jawne HTTP 404 dla brakujących plików `/data/*`
- **Pułapka:** Typowy serwer SPA zwracający `index.html` dla każdego nieznanego adresu powoduje, że `fetch('data/brak.json')` dostaje kod HTML zamiast błędu 404 i kończy się nieczytelnym błędem składni JSON.
- **Zasada:** `tools/serve.mjs` dla ścieżek `data/*` zwraca zawsze jawny status `404` w formacie JSON.

### L13. Akceptacja wyniku przez właściciela nigdy nie jest poleceniem scalenia PR-a
- **Pułapka:** Po pochwale lub pytaniu „czy to już widać?” agent może błędnie wywołać `gh pr merge`, zamykając sobie dostęp do sesji i odbierając właścicielowi ostateczny przegląd.
- **Zasada:** Agent nigdy nie wywołuje `gh pr merge` ani `gh pr close`. Zawsze zostawia otwarty, zielony PR do decyzji właściciela.

### L14. Akta, Światy Lustrzane, Abominacje i Zapiski Dantego to opowieść, nie „śmieci z interfejsu”
- **Pułapka:** Zbyt mechaniczne stosowanie zasady „fabuła przed mechaniką” może skłonić do odrzucenia opisów Tożsamości ze Światów Lustrzanych lub dzienników obserwacji Abominacji, w których kryje się lwia część wiedzy o Mieście.
- **Zasada:** Odrzucamy wyłącznie liczby i reguły walki (monety, obrażenia, progi, rzadkości); każdy akapit opowieści z akt, Światów Lustrzanych, E.G.O i *Zapisków Dantego* wchodzi do kroniki we właściwej warstwie pochodzenia.
