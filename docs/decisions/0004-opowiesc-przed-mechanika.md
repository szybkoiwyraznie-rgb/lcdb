# 0004. Opowieść przed mechaniką: dziesięć fabułocentrycznych typów świata *Limbus Company* i układ 3:1

Status: przyjęta (2026-11-25)

## Kontekst

*Limbus Company* łączy głęboką powieść drogi i dramat dwunastu Grzeszników z rozbudowaną warstwą gry mobilnej/PC (etapy walk, banery gacha, poziomy Uptie/Threadspin, rzuty monetą, grzechy jako kolory żetonów). Gdyby architektura witryny podążała za strukturą menu gry, kronika zmieniłaby się w wiki poradnikową zamiast przewodnika po opowieści.

## Decyzja

1. Strukturę kroniki tworzy dokładnie **dziesięć typów kart wynikających ze świata i narracji**:
   - osi opowieści: `rozdzial` (Prolog, Pieśń / *Canto*, Interludium / *Intervallo*, krótka opowieść), `epizod`, `scena`, `watek`,
   - ludzi i struktur Miasta: `postac` (w tym `numer_grzesznika`), `frakcja` (Skrzydła, stowarzyszenia, biura, warsztaty, syndykaty, wydziały), `dzielnica` (Dzielnice Miasta 1–26, Gniazda, Zaułki, Obrzeża, Ruiny), `miejsce`,
   - znaczeń i zjawisk: `kontekst` (dzieła literackie, mity, filozofia), `pojecie` (Złote Gałęzie, Anomalie, E.G.O, Osobliwości, Światy Lustrzane, prawa Miasta).
2. Widoki szczegółowe (rozdział, epizod, scena, encja) korzystają z czytelnego układu dwukolumnowego **3:1**: szeroka kolumna główna niesie narrację i boksy `##`, a przyklejona prawa kolumna boczna podaje u góry szybki spis boksów *Na tej stronie* (gdy sekcji `##` jest co najmniej dwie) oraz powiązane byty i interpretacje.

## Konsekwencje

- Nawigacja główna odpowiada pytaniom czytelnika śledzącego fabułę („kto?”, „gdzie w Mieście?”, „jaka organizacja?”, „jaki wątek?”, „jakie dzieło literackie?”), a nie strukturze ekranów aplikacji.
