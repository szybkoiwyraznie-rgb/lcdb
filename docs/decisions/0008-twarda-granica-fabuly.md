# 0008. Twarda granica poznanej fabuły w `rozgrywka/postep.json`

Status: przyjęta (2026-11-25)

## Kontekst

Kronika musi pozostać w 100% bezpieczna do czytania w dowolnym momencie grania — także wtedy, gdy w paczkach pomocniczych właściciela na Dysku Google leżą pliki z dalszych rozdziałów albo gdy model pamięta późniejsze losy bohaterów.

## Decyzja

1. Plik `rozgrywka/postep.json` przechowuje pole `"ostatnia_scena"` wskazujące slug ostatniej opowiedzianej sceny.
2. Każda karta `scena` posiada unikalny, ciągły od `1` numer `kolejnosc`. Funkcja `sprawdzGraniceFabuly` przerywa build i testy, jeśli jakakolwiek scena ma `kolejnosc` większą niż scena graniczna z `postep.json`, jeśli w numeracji jest luka albo duplikat.
3. Zakaz wyprzedzania fabuły obowiązuje w równym stopniu karty wszystkich pozostałych typów (`postacie/`, `frakcje/`, `dzielnice/`, `miejsca/`, `watki/`, `konteksty/`, `pojecia/`): żaden przydomek, przynależność ani fakt ujawniany dopiero za granicą `ostatnia_scena` nie może pojawić się na karcie wcześniej.

## Konsekwencje

- Granica bezspoilerowości ma jednoznaczny punkt odniesienia w repozytorium, egzekwowany automatycznie przy każdym uruchomieniu `npm test` i `npm run build`.
