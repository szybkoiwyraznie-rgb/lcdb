/**
 * Lekki parser frontmattera YAML dla plików treści kroniki.
 *
 * Obsługuje podzbiór faktycznie używany w kartach `content/`:
 *  - pary `klucz: wartość` (napisy w cudzysłowach lub bez, liczby całkowite
 *    i ujemne, wartości logiczne),
 *  - listy w nawiasach `tagi: [a, b, c]`,
 *  - listy wieloliniowe z myślnikiem (`- element` oraz `- klucz: wartość`
 *    dla `zrodla:` i `interpretacje:`),
 *  - mapy zagnieżdżone o jeden poziom (`sekcje_analizy:`),
 *  - napisy wieloliniowe `klucz: |`.
 *
 * Świadomie nie implementuje pełnego YAML-a — ma być przewidywalny, czytelny
 * i działać bez zewnętrznych zależności (ADR 0002).
 */

/**
 * Rozdziela plik Markdown na `{ data, body }`. Jeśli plik nie zaczyna się
 * od `---`, zwraca puste `data` i pełną treść jako `body`.
 */
export function parsujFrontmatter(tekst) {
  const znormalizowany = tekst.replace(/\r\n/g, '\n');
  if (!znormalizowany.startsWith('---\n') && znormalizowany !== '---') {
    return { data: {}, body: znormalizowany };
  }

  const koniec = znormalizowany.indexOf('\n---\n', 4);
  const koniecNaKoncu = koniec === -1 && znormalizowany.endsWith('\n---')
    ? znormalizowany.length - 4
    : koniec;

  if (koniecNaKoncu === -1) {
    throw new Error('Niezamknięty blok frontmattera (brak końcowego ---)');
  }

  const surowyYaml = znormalizowany.slice(4, koniecNaKoncu);
  const body = znormalizowany.slice(koniecNaKoncu + 5).replace(/^\n/, '');
  return { data: parsujBlokYaml(surowyYaml), body };
}

export { parsujFrontmatter as parseFrontmatter };

function parsujBlokYaml(tekst) {
  const linie = tekst.split('\n');
  const wynik = {};
  let i = 0;

  while (i < linie.length) {
    const linia = linie[i];
    if (linia.trim() === '' || linia.trim().startsWith('#')) {
      i += 1;
      continue;
    }

    const dopasowanie = linia.match(/^([a-zA-Z0-9_-]+):(.*)$/);
    if (!dopasowanie) {
      throw new Error(`Niepoprawna linia frontmattera: "${linia}"`);
    }

    const klucz = dopasowanie[1];
    const reszta = dopasowanie[2].trim();

    if (reszta === '|') {
      const zebrane = [];
      i += 1;
      while (i < linie.length && (linie[i].startsWith('  ') || linie[i].trim() === '')) {
        zebrane.push(linie[i].startsWith('  ') ? linie[i].slice(2) : '');
        i += 1;
      }
      wynik[klucz] = zebrane.join('\n').replace(/\n+$/, '');
      continue;
    }

    if (reszta === '') {
      const elementy = [];
      const mapa = {};
      let trybMapy = false;
      i += 1;
      while (i < linie.length) {
        const nastepna = linie[i];
        if (nastepna.trim() === '' || nastepna.trim().startsWith('#')) {
          i += 1;
          continue;
        }
        if (!nastepna.startsWith(' ')) break;

        const obcieta = nastepna.trim();
        if (obcieta.startsWith('- ')) {
          const poMyslniku = obcieta.slice(2).trim();
          const wciecie = wciecieLinii(nastepna);
          const paraObiektu = poMyslniku.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
          if (paraObiektu && !poMyslniku.startsWith('"') && !poMyslniku.startsWith("'")) {
            const { obiekt, nastepnyIndeks } = parsujObiektListy(linie, i, wciecie, paraObiektu);
            elementy.push(obiekt);
            i = nastepnyIndeks;
            continue;
          }
          elementy.push(parsujSkalar(poMyslniku));
          i += 1;
        } else if (obcieta === '-') {
          const wciecie = wciecieLinii(nastepna);
          const { obiekt, nastepnyIndeks } = parsujObiektListy(linie, i + 1, wciecie, null);
          elementy.push(obiekt);
          i = nastepnyIndeks;
        } else {
          const para = obcieta.match(/^([^:]+):(.*)$/);
          if (!para) {
            throw new Error(`Niepoprawny element pod kluczem "${klucz}": "${nastepna}"`);
          }
          trybMapy = true;
          mapa[odcudzyslow(para[1].trim())] = parsujSkalar(para[2].trim());
          i += 1;
        }
      }
      wynik[klucz] = trybMapy ? mapa : elementy;
      continue;
    }

    wynik[klucz] = parsujWartosc(reszta);
    i += 1;
  }

  return wynik;
}

function wciecieLinii(linia) {
  let n = 0;
  while (n < linia.length && linia[n] === ' ') n += 1;
  return n;
}

function parsujObiektListy(linie, start, wciecieMyslnika, pierwszaPara) {
  const obiekt = {};
  let i = start;

  if (pierwszaPara) {
    obiekt[pierwszaPara[1]] = parsujWartoscPolaObiektu(linie, start, wciecieMyslnika + 2, pierwszaPara[2]);
    i = przeskoczWieloliniowePole(linie, start, wciecieMyslnika + 2, pierwszaPara[2]);
  }

  while (i < linie.length) {
    const linia = linie[i];
    if (linia.trim() === '' || linia.trim().startsWith('#')) {
      i += 1;
      continue;
    }
    const wciecie = wciecieLinii(linia);
    if (wciecie <= wciecieMyslnika) break;

    const obcieta = linia.trim();
    const para = obcieta.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!para) {
      throw new Error(`Niepoprawne pole obiektu listy: "${linia}"`);
    }
    obiekt[para[1]] = parsujWartoscPolaObiektu(linie, i, wciecie, para[2]);
    i = przeskoczWieloliniowePole(linie, i, wciecie, para[2]);
  }

  return { obiekt, nastepnyIndeks: i };
}

function parsujWartoscPolaObiektu(linie, indeks, wcieciePola, surowaWartosc) {
  if (surowaWartosc.trim() !== '|') {
    return parsujWartosc(surowaWartosc.trim());
  }
  const zebrane = [];
  let i = indeks + 1;
  const bazaWciecia = wcieciePola + 2;
  while (i < linie.length) {
    const linia = linie[i];
    if (linia.trim() === '') {
      zebrane.push('');
      i += 1;
      continue;
    }
    if (wciecieLinii(linia) < bazaWciecia) break;
    zebrane.push(linia.slice(bazaWciecia));
    i += 1;
  }
  return zebrane.join('\n').replace(/\n+$/, '');
}

function przeskoczWieloliniowePole(linie, indeks, wcieciePola, surowaWartosc) {
  if (surowaWartosc.trim() !== '|') return indeks + 1;
  let i = indeks + 1;
  const bazaWciecia = wcieciePola + 2;
  while (i < linie.length) {
    const linia = linie[i];
    if (linia.trim() !== '' && wciecieLinii(linia) < bazaWciecia) break;
    i += 1;
  }
  return i;
}

function parsujWartosc(wartosc) {
  if (wartosc.startsWith('[') && wartosc.endsWith(']')) {
    const wnetrze = wartosc.slice(1, -1).trim();
    if (wnetrze === '') return [];
    return podzielListeInline(wnetrze).map((el) => parsujSkalar(el.trim()));
  }
  return parsujSkalar(wartosc);
}

function podzielListeInline(tekst) {
  const wynik = [];
  let bufor = '';
  let cudzyslow = null;
  for (let i = 0; i < tekst.length; i += 1) {
    const znak = tekst[i];
    if (cudzyslow) {
      bufor += znak;
      if (znak === cudzyslow && tekst[i - 1] !== '\\') cudzyslow = null;
    } else if (znak === '"' || znak === "'") {
      cudzyslow = znak;
      bufor += znak;
    } else if (znak === ',') {
      wynik.push(bufor);
      bufor = '';
    } else {
      bufor += znak;
    }
  }
  wynik.push(bufor);
  return wynik;
}

function parsujSkalar(wartosc) {
  if (wartosc === '' || wartosc === 'null' || wartosc === '~') return null;
  if (wartosc === 'true') return true;
  if (wartosc === 'false') return false;
  if (/^-?\d+$/.test(wartosc)) return Number.parseInt(wartosc, 10);
  if (/^-?\d+\.\d+$/.test(wartosc)) return Number.parseFloat(wartosc);
  return odcudzyslow(wartosc);
}

function odcudzyslow(wartosc) {
  if (
    (wartosc.startsWith('"') && wartosc.endsWith('"')) ||
    (wartosc.startsWith("'") && wartosc.endsWith("'"))
  ) {
    return wartosc
      .slice(1, -1)
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\');
  }
  return wartosc;
}
