# Przepływ obróbki dostawy z rozgrywki (`docs/guides/PRZEPLYW_SCENY.md`)

Ten przewodnik opisuje standardową pętlę pracy sesji, w której właściciel przekazuje nowy materiał z rozgrywki *Limbus Company*. Każda dostawa przechodzi przez te same kroki, tak aby żaden dialog nie został pominięty, żadna liczba mechaniczna nie przeniknęła do kart fabularnych, a granica spoilerów pozostała szczelna.

---

## 1. Przyjęcie dostawy i archiwum niemodyfikowalne

Właściciel może przekazać materiał na trzy sposoby:

1. wkleić zapis bezpośrednio w wiadomości,
2. dołączyć plik tekstowy do rozmowy,
3. wskazać plik lub paczkę na Google Drive (pobierz ją roboczo do ignorowanego przez Gita katalogu `google_drive/` — zob. [`docs/guides/ENVIRONMENT.md`](ENVIRONMENT.md) §6).

### Krok 1.1 — Jeśli to pierwsza prawdziwa dostawa rozgrywki: usuń zaślepkę

Na starcie repozytorium w `content/` i `rozgrywka/` leży neutralny materiał techniczny oznaczony tagiem `zaslepka` (oraz `rozgrywka/zapisy/zaslepka-001.md`). Przy **pierwszej prawdziwej dostawie z gry**:

```bash
grep -rl 'zaslepka' content/ rozgrywka/
```

Usuń wszystkie pliki zaślepki w jednym czystym ruchu wraz z wprowadzeniem pierwszych prawdziwych kart, tak aby w kronice nie mieszały się byty testowe ze światem gry.

### Krok 1.2 — Zapisz surowe archiwum w `rozgrywka/zapisy/`

1. Utwórz nowy plik `rozgrywka/zapisy/<RRRR-MM-DD>-<nr>.md` (np. `2026-11-26-001.md`).
2. Wklej do niego dostarczony materiał **bez wygładzania stylu, poprawiania interpunkcji ani dopisywania słów**. Kwestie zegarowe Dantego (`<…>`), zająknięcia, wielokropki i oryginalne oznaczenia mówców zostają w brzmieniu źródłowym.
3. Jeżeli paczka na Google Drive zawiera więcej rozdziałów niż właściciel rozegrał, do `rozgrywka/zapisy/` przenieś **wyłącznie** rozegrany odcinek wskazany przez właściciela.
4. Po zapisaniu pliku w `rozgrywka/zapisy/` staje się on **niemodyfikowalnym dowodem** — w kolejnych sesjach nie wolno go przeredagowywać.

---

## 2. Podział materiału na rozdział, epizody i sceny

Nie dziel opowieści według technicznych identyfikatorów etapów ani walk z gry ([ADR 0004](../decisions/0004-opowiesc-przed-mechanika.md), [ADR 0009](../decisions/0009-scena-jedno-wydarzenie.md)):

1. **Scena (`content/sceny/`)** to **jedno wydarzenie fabularne** połączone miejscem, czasem i napięciem dramatycznym:
   - jeśli gra rozbiła jedną rozmowę przed bitwą i po bitwie na dwa techniczne segmenty w tym samym miejscu, złóż je w jedną spójną kartę sceny (podzieloną śródtytułami `###`),
   - jeśli w jednym długim segmencie bohaterowie przenoszą się z lasu na pokład autobusu i rozpoczynają zupełnie nową rozmowę, rozdziel to na dwie osobne sceny,
   - jednozdaniowy okruch nigdy nie tworzy osobnej sceny (minimum w `:::zapis` to 2 elementy dialogu/narracji — dołącz drobny okruch do sąsiedniej sceny).
2. **Epizod (`content/epizody/`)** grupuje kilka kolejnych scen składających się na jeden odcinek podróży.
3. **Rozdział (`content/rozdzialy/`)** odpowiada Prologowi, danej Pieśni (*Canto*) lub *Intervallo*.

---

## 3. Najpierw przesuń granicę fabuły (`rozgrywka/postep.json`)

Zanim uruchomisz `npm run build`, zaktualizuj `rozgrywka/postep.json` tak, aby `ostatnia_scena` wskazywała slug ostatniej nowo dodanej sceny ([ADR 0008](../decisions/0008-granica-fabuly.md), lekcja L1 w [`docs/LESSONS.md`](../LESSONS.md)):

```json
{
  "ostatnia_scena": "slug-ostatniej-rozegranej-sceny",
  "zaktualizowano": "2026-11-26",
  "uwaga": "Granica rozegranej opowieści — żadna scena o wyższej kolejności nie przejdzie budowania."
}
```

Sprawdź ciągłość pola `kolejnosc` (`1..N` bez dziur i duplikatów) we wszystkich kartach `content/sceny/*.md`.

---

## 4. Opracowanie karty sceny

Każda karta `content/sceny/<slug>.md` zawiera:

1. **`## Treść sceny`** wewnątrz `{{dostawa` … `}}`, podzieloną na czytelne podsekcje `###` z dosłownymi blokami `:::zapis ... :::` skopiowanymi 1:1 z `rozgrywka/zapisy/<plik>.md`.
2. **`## Analiza`** wewnątrz `{{opracowanie` … `}}`, z podsekcjami `###` powiązanymi z treścią sceny w polu `sekcje_analizy`:
   - analiza nie powtarza dialogu innymi słowami — wydobywa stawkę rozmowy, relacje między postaciami, przemilczenia, sprzeczności i pierwsze sygnały wątków.
3. **Warstwy kontekstu i hipotez** (gdy scena daje ku temu podstawy):
   - sprawdzone odniesienia literackie/historyczne w `{{kwerenda` z `{{zrodlo tytul="…" adres="https://…" data="RRRR-MM-DD"}}`,
   - dobrze ugruntowane domysły wynikające **wyłącznie z dotychczasowych scen** w `{{model pewnosc=NN pytanie="…"}}` (pamiętaj o bezwzględnym zakazie pozorowanych hipotez z wiedzy modelu o dalszych Pieśniach!).

---

## 5. Obróbka akt, Światów Lustrzanych, Abominacji i Zapisków Dantego

Dostawa z *Limbus Company* oprócz dialogów scen często zawiera materiały towarzyszące ([ADR 0016](../decisions/0016-akta-lustra-i-zapiski-to-lore.md)):

| Materiał w dostawie | Gdzie trafia w kronice | Co zachowujemy, a co odrzucamy |
|---|---|---|
| Akta Grzeszników i profile osób | `content/postacie/` (warstwa `{{dostawa` / `{{opracowanie`) | Zachowujemy rys charakteru, przeszłość, uwagi rekrutacyjne i powiązania; odrzucamy statystyki bojowe |
| Opowieści Tożsamości (*Światy Lustrzane*) i ich gawędy | `content/pojecia/` (`rodzaj: lustro`) oraz powiązania do `postac`, `organizacja`, `dzielnica` | Zachowujemy pełną opowieść o alternatywnej roli postaci i zwyczajach danego Syndykatu/Zrzeszenia/Korporacji; odrzucamy monety, obrażenia i stopnie `0`/`00`/`000` |
| Dzienniki obserwacji Abominacji i opisy E.G.O | `content/pojecia/` (`rodzaj: istota` lub `zjawisko`) | Zachowujemy opis wyglądu, zachowania, symboliki i notatki obserwatorów; odrzucamy odporności liczbowe i koszt zasobów |
| *Zapiski Dantego* (*Dante's Notes*) | Właściwe karty `organizacja`, `dzielnica`, `pojecie` oraz `watek` | Zachowujemy każde spostrzeżenie narratora o Mieście wraz z datą/momentem, w którym zostało dopisane |

---

## 6. Aktualizacja kart powiązanych, rewizja hipotez i dziennik

1. **Załóż lub zaktualizuj karty encji** (`postac`, `organizacja`, `dzielnica`, `miejsce`, `pojecie`, `watek`, `kontekst`) dla każdego ważnego elementu, który pojawił się w nowej scenie. Nie wpisuj przynależności ani ról, które nie padły jeszcze w dostarczonym materiale!
2. **Przejrzyj istniejące hipotezy (`#/hipotezy`):** jeśli nowa scena potwierdziła, zawęziła albo obaliła dawny domysł na dowolnej karcie, przenieś poprzednie brzmienie do pola `interpretacje:` we frontmatterze tej karty (`data: RRRR-MM-DD GG:MM`, `fragment`, `zmiana`, `poprzednio`, `pewnosc_poprzedniego`, `pewnosc`).
3. **Dopisz wpis na górze `content/co-nowego.md`** pod nagłówkiem `## RRRR-MM-DD GG:MM` — czystym językiem świata przedstawionego (bez słów „dodano kartę”, „zaktualizowano wpis”, „w dostawie”).
4. **Uruchom komplet bram i odśwież podgląd:**
   ```bash
   npm run zapis
   npm test
   npm run build
   ```
   Sprawdź, czy `tools/sprawdz-zapis.mjs` nie wskazuje pominiętych kwestii dialogowych z dostawy, wypchnij commit na gałąź sesji i zaktualizuj opis PR-a.
