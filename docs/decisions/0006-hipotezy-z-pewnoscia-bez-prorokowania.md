# 0006. Hipotezy z jawną pewnością `0–100%` oraz zakaz prorokowania z przyszłych Pieśni

Status: przyjęta (2026-11-25)

## Kontekst

Świat *Limbus Company* buduje napięcie przez niedopowiedzenia, półprawdy korporacji i stopniowo odsłanianą przeszłość Grzeszników. Jednocześnie modele językowe znają z treningu późniejsze rozdziały gry, wcześniejsze tytuły studia Project Moon oraz fabułę powieści będących pierwowzorami bohaterów. Pozorne „zgadywanie” przyszłych zwrotów akcji z tej pamięci zepsułoby lekturę równie mocno jak bezpośredni spoiler.

## Decyzja

1. Każde przypuszczenie wykraczające poza jednoznaczny fakt ze scen zapisywane jest wyłącznie jako `{{model pewnosc=NN pytanie="…"}}` (`NN` całkowite `0–100`), otrzymuje osobny kolor fioletowy, plakietkę pewności i kotwicę `#hip-…` oraz trafia do przekrojowego widoku `#/hipotezy` z podziałem na progi: wysoka (`80–100%`), średnia (`50–79%`), niska (`1–49%`).
2. Atrybut `pewnosc=` jest zabroniony na warstwach `dostawa`, `opracowanie` i `kwerenda`.
3. **Zakaz prorokowania:** każda hipoteza musi opierać się wyłącznie na wskazanych przesłankach z **już rozegranych** scen. Formułowanie „trafnych domysłów” na bazie znajomości przyszłych Pieśni (*Canto*), wiki gry lub zakończeń pierwowzorów literackich jest traktowane na równi ze spoilerem i podlega usunięciu w audycie merytorycznym (3a).

## Konsekwencje

- Widok `#/hipotezy` staje się autentycznym zapisem pytań towarzyszących poznawaniu historii na bieżąco, a nie ukrytym streszczeniem przyszłości.
