# 0007. Zachowywanie zastąpionych odczytań w polu `interpretacje:` i renderowanie *Poprzedniej wersji*

Status: przyjęta (2026-11-25)

## Kontekst

W miarę rozwoju opowieści wcześniejsze przypuszczenia bywają obalane, zawężane albo nieoczekiwanie potwierdzane z zupełnie innego powodu. Gdyby aktualizacja karty polegała na cichym skasowaniu dawnego akapitu, kronika udawałaby, że od początku wszystko było oczywiste.

## Decyzja

1. Ilekroć nowa scena zmienia sens lub istotnie przesuwa pewność wcześniejszej interpretacji, przed edycją sekcji autor przenosi **dosłowne brzmienie** zastępowanego fragmentu do listy `interpretacje:` we frontmatterze karty (`data: "RRRR-MM-DD GG:MM"`, `fragment: "<Tytuł sekcji ##>"`, `zmiana: "…"`, opcjonalnie `pewnosc_poprzedniego` i `pewnosc`, `poprzednio: |`).
2. Walidator `walidujInterpretacje` pilnuje poprawności daty z godziną, obecności opisu zmiany oraz istnienia wskazanej sekcji `## <fragment>` na karcie.
3. Widoki scen, rozdziałów, epizodów i encji automatycznie renderują na dole wskazanej sekcji `##` zwijany element `<details class="historia-interpretacji">` (*Poprzednia wersja*), dzięki czemu ślad dawnego rozumienia jest bezpośrednio dostępny dla czytelnika.

## Konsekwencje

- Kronika dokumentuje nie tylko aktualny stan wiedzy o świecie, lecz także drogę dochodzenia do niego przez kolejne rozdziały.
