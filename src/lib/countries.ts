// Every country in the world, by ISO code. Names and flags are generated so
// the list always stays complete and correctly spelled.

export const COUNTRY_CODES = [
  "AF","AX","AL","DZ","AS","AD","AO","AI","AG","AR","AM","AW","AU","AT","AZ","BS","BH","BD","BB","BY",
  "BE","BZ","BJ","BM","BT","BO","BA","BW","BR","BN","BG","BF","BI","KH","CM","CA","CV","KY","CF","TD",
  "CL","CN","CO","KM","CG","CD","CK","CR","CI","HR","CU","CW","CY","CZ","DK","DJ","DM","DO","EC","EG",
  "SV","GQ","ER","EE","SZ","ET","FJ","FI","FR","GF","PF","GA","GM","GE","DE","GH","GI","GR","GL","GD",
  "GP","GU","GT","GG","GN","GW","GY","HT","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT",
  "JM","JP","JE","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY","LI","LT","LU",
  "MO","MG","MW","MY","MV","ML","MT","MH","MQ","MR","MU","YT","MX","FM","MD","MC","MN","ME","MS","MA",
  "MZ","MM","NA","NR","NP","NL","NC","NZ","NI","NE","NG","NU","MK","NO","OM","PK","PW","PS","PA","PG",
  "PY","PE","PH","PL","PT","PR","QA","RE","RO","RU","RW","BL","KN","LC","MF","PM","VC","WS","SM","ST",
  "SA","SN","RS","SC","SL","SG","SX","SK","SI","SB","SO","ZA","SS","ES","LK","SD","SR","SE","CH","SY",
  "TW","TJ","TZ","TH","TL","TG","TK","TO","TT","TN","TR","TM","TC","TV","UG","UA","AE","GB","US","UY",
  "UZ","VU","VA","VE","VN","VG","VI","WF","EH","YE","ZM","ZW",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

/**
 * Plain, everyday country names. Different devices spell a few places
 * differently ("Hong Kong SAR China"), so we tidy them to one simple form.
 */
function tidy(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+(SAR\s+China|SAR|Special Administrative Region.*)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function countryName(code: string): string {
  const raw = regionNames?.of(code) ?? code;
  return tidy(raw) || code;
}


/** Turn "IN" into the 🇮🇳 flag emoji. */
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export type Country = { code: string; name: string; flag: string };

export const COUNTRIES: Country[] = COUNTRY_CODES
  .map((code) => ({ code, name: countryName(code), flag: countryFlag(code) }))
  .sort((a, b) => a.name.localeCompare(b.name));
