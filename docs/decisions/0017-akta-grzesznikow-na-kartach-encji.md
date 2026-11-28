# 0017. Akta Grzeszników: osobne archiwum, w całości zacytowane na kartach encji

Status: przyjęta (2026-11-27)

## Kontekst

Dostawa LC_0_2 zawiera, obok fabuły Etapu 0-2 i wskazówek, blok „Akta Grzeszników (introdukcje)”: dwanaście krótkich notatek, w których firma przedstawia Kierownikowi Grzeszników #1–12. To nie jest ani zdarzenie fabularne (nikt w scenie ich nie czyta, nie mają miejsca ani czasu akcji), ani objaśnienie sterowania. To dokument świata: pisany głosem firmy („my”, „nasza firma”), zwrócony do Kierownika („pan”), pełen ocen, ostrzeżeń i zatarć („[UTAJNIONO]”, „***”). Niesie fakty, których dialog nie podaje — numery Grzeszników, nazwę „Limbus Company”, pochodzenie niektórych z nich.

Reguły dotychczasowe nie pasowały. ADR 0009 wiąże każdy wiersz archiwum fabuły z jakąś sceną, więc akta albo trzeba by wcisnąć w scenę, do której nie należą, albo zostawić niepokryte. ADR 0016 zwalnia wskazówki z pokrycia, ale tylko dlatego, że to w większości mechanika, z której bierzemy same nazwy. Akta są treścią świata w całości i powinny być w kronice widoczne słowo w słowo.

## Decyzja

1. **Archiwum:** akta zapisujemy dosłownie w osobnym pliku `rozgrywka/zapisy/RRRR-MM-DD-<nr>-<slug>-akta.md` (nazwa kończy się na `-akta.md`, `czyArchiwumAkt`). Silnik zna trzy rodzaje archiwów (`rodzajArchiwum`): `fabula`, `akta` i `wskazowki`.
2. **Nie są sceną:** scena wskazująca archiwum akt w `zapis:` zatrzymuje build (`sprawdzWiernoscSceny`).
3. **Są w całości na kartach:** każdy wiersz akt (poza nagłówkami `#`) musi być dosłownie zacytowany w bloku `:::zapis` na którejś karcie encji, zwykle w sekcji `## Akta Grzesznika` na karcie danej postaci. Pilnuje tego `npm run zapis`.
4. **Wierność cytatów na kartach:** każdy blok `:::zapis` na karcie innej niż scena musi być dosłownym fragmentem któregoś archiwum z `rozgrywka/zapisy/` (porównanie z ujednoliconymi białymi znakami, `sprawdzWiernoscCytatow`). Sprawdzają to build i `npm run zapis`. Brama dotyczy wszystkich archiwów, także fabuły i wskazówek: cytaty na kartach przestają być „na słowo honoru”.
5. **Jak piszemy o aktach:** cytat leży w `{{dostawa}}`, a pod nim `{{opracowanie}}` streszcza, co akta mówią, wyraźnie jako zdanie firmy („akta piszą…”, „według akt…”). Akta są źródłem w świecie, nie narratorem: ich oceny bywają protekcjonalne i mogą się okazać jednostronne. Gdy fabuła powie coś innego, wygrywa fabuła, a wcześniejszy wniosek przechodzi do `interpretacje:` (ADR 0007).
6. **Pola:** numer z akt trafia do `numer_grzesznika`. Słownictwo mechaniki w aktach („misja”, „walka”) zostaje wewnątrz cytatu, a brama języka (ADR 0012) nadal obejmuje wszystko poza `:::zapis`.

## Konsekwencje

- Żaden wiersz akt nie ginie po drodze i nie trzeba wymyślać dla nich sztucznej sceny.
- Karta postaci zyskuje drugi głos obok fabuły: to, co postać mówi o sobie, można zestawić z tym, co pisze o niej firma.
- Brama z p. 4 wykrywa każdą przeredagowaną lub przepisaną z pamięci kwestię w cytatach kart — także w tych, które istniały przed tą decyzją.
- Przyszłe dokumenty świata o tym samym charakterze (inne akta, raporty) można archiwizować tak samo, z końcówką `-akta.md`.
