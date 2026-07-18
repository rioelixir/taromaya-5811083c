// Divisional-chart (varga) sign allocation from sidereal longitude.
// Parashari rules. Longitude is 0..360 sidereal.

const norm = (x: number) => ((x % 360) + 360) % 360;

/** D9 Navamsha — 3°20' each. Movable: same sign; Fixed: 9th from; Dual: 5th from. */
export function navamshaSign(longitude: number): number {
  const lon = norm(longitude);
  const sign = Math.floor(lon / 30);
  const within = lon - sign * 30;
  const pada = Math.floor(within / (30 / 9)); // 0..8
  const type = sign % 3; // 0 movable, 1 fixed, 2 dual
  const startSign = type === 0 ? sign : type === 1 ? (sign + 8) % 12 : (sign + 4) % 12;
  return (startSign + pada) % 12;
}

/** Generic Dn allocation for common Parashari vargas. Returns sign index 0..11. */
export function vargaSign(longitude: number, n: number): number {
  const lon = norm(longitude);
  if (n === 1) return Math.floor(lon / 30);
  if (n === 9) return navamshaSign(lon);
  // D2 Hora, D3 Drekkana, D7 Saptamsa, D10 Dashamsa, D12 Dwadashamsa,
  // D16, D20, D24, D27, D30, D40, D45, D60 — general rule via equal divisions.
  const sign = Math.floor(lon / 30);
  const within = lon - sign * 30;
  const part = Math.floor(within / (30 / n));
  return (sign + part) % 12;
}
