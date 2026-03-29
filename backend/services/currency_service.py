import logging
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Simple in-process cache so we don't hammer the exchange-rate API on every
# expense submission.  Rates are cached per base currency for 1 hour.
# ---------------------------------------------------------------------------
_CACHE: dict[str, dict] = {}   # { "USD": {"rates": {...}, "ts": float} }
_CACHE_TTL = 3600               # seconds


# ---------------------------------------------------------------------------
# Exchange-rate helpers
# ---------------------------------------------------------------------------

async def _fetch_rates(base_currency: str) -> dict[str, float]:
    """
    Fetch live exchange rates for *base_currency* from the free
    ExchangeRate-API endpoint.  Returns a dict mapping currency code → rate.
    Raises httpx.HTTPError on network / API failure.
    """
    url = f"https://api.exchangerate-api.com/v4/latest/{base_currency.upper()}"
    async with httpx.AsyncClient(timeout=8) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
    return data.get("rates", {})


async def get_rates(base_currency: str) -> dict[str, float]:
    """
    Return exchange rates for *base_currency*, using the cache when fresh.
    Falls back to an empty dict (→ no conversion) on any error.
    """
    key   = base_currency.upper()
    entry = _CACHE.get(key)

    if entry and (time.time() - entry["ts"]) < _CACHE_TTL:
        return entry["rates"]

    try:
        rates = await _fetch_rates(key)
        _CACHE[key] = {"rates": rates, "ts": time.time()}
        return rates
    except Exception as exc:
        logger.error("Failed to fetch exchange rates for %s: %s", key, exc)
        return entry["rates"] if entry else {}


async def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
) -> float:
    """
    Convert *amount* from *from_currency* to *to_currency*.
    Returns the original amount unchanged when:
      - currencies are identical, or
      - the exchange rate cannot be fetched.
    """
    from_currency = from_currency.upper()
    to_currency   = to_currency.upper()

    if from_currency == to_currency:
        return round(amount, 2)

    rates = await get_rates(from_currency)
    rate  = rates.get(to_currency)

    if not rate:
        logger.warning(
            "No rate found for %s → %s; returning original amount",
            from_currency, to_currency,
        )
        return round(amount, 2)

    converted = amount * rate
    logger.debug(
        "Converted %.4f %s → %.4f %s  (rate: %.6f)",
        amount, from_currency, converted, to_currency, rate,
    )
    return round(converted, 2)


# ---------------------------------------------------------------------------
# Country / currency catalogue helpers
# ---------------------------------------------------------------------------

async def get_countries_with_currencies() -> list[dict]:
    """
    Fetch the full country → currency mapping from restcountries.com.
    Returns a sorted list of dicts:
        { country, currency_code, currency_name, symbol }
    Falls back to an empty list on failure.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://restcountries.com/v3.1/all?fields=name,currencies"
            )
            resp.raise_for_status()
            data = resp.json()

        result: list[dict] = []
        for country in data:
            country_name = country.get("name", {}).get("common", "")
            for code, info in country.get("currencies", {}).items():
                result.append({
                    "country":       country_name,
                    "currency_code": code,
                    "currency_name": info.get("name",   ""),
                    "symbol":        info.get("symbol", ""),
                })

        return sorted(result, key=lambda x: x["country"])

    except Exception as exc:
        logger.error("Failed to fetch country/currency list: %s", exc)
        return []


async def get_supported_currencies() -> list[dict]:
    """
    Return a deduplicated list of currencies supported by the exchange-rate
    API, enriched with country metadata where available.
    Format: { currency_code, currency_name, symbol, countries: [...] }
    """
    try:
        # Fetch any base (USD) to get the full supported currency list
        rates = await get_rates("USD")
        country_data = await get_countries_with_currencies()

        # Build a lookup: currency_code → { currency_name, symbol, countries }
        lookup: dict[str, dict] = {}
        for entry in country_data:
            code = entry["currency_code"]
            if code not in lookup:
                lookup[code] = {
                    "currency_code": code,
                    "currency_name": entry["currency_name"],
                    "symbol":        entry["symbol"],
                    "countries":     [],
                }
            lookup[code]["countries"].append(entry["country"])

        result = []
        for code in sorted(rates.keys()):
            if code in lookup:
                result.append(lookup[code])
            else:
                result.append({
                    "currency_code": code,
                    "currency_name": code,
                    "symbol":        "",
                    "countries":     [],
                })

        return result

    except Exception as exc:
        logger.error("Failed to build supported currencies list: %s", exc)
        return []


def format_amount(amount: float, currency_code: str, symbol: Optional[str] = None) -> str:
    """
    Format *amount* as a human-readable currency string.
    e.g.  format_amount(1234.5, "USD", "$")  →  "$ 1,234.50"
          format_amount(1234.5, "EUR")        →  "EUR 1,234.50"
    """
    prefix = f"{symbol} " if symbol else f"{currency_code.upper()} "
    return f"{prefix}{amount:,.2f}"