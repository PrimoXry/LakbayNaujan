# Destination weather

Each destination details page requests current weather from Open-Meteo using the latitude and longitude saved by the admin. No API key, package installation, or additional database table is required.

1. Save both coordinates in the admin form using decimal degrees.
2. Open that destination from the tourist list and select **View details**.
3. The weather card shows temperature, feels-like temperature, humidity, wind, precipitation and a condition label. Its timestamp is the weather data's valid time, displayed in Philippine time.

Successful responses are cached in memory for 15 minutes per coordinate pair while the app is open. Reopening a destination uses that cache or fetches again if it has expired; the card does not poll in the background. Failed requests can be retried and do not block destination details. Missing measurements show a dash, and missing/invalid coordinates show an unavailable message. Requests time out after 12 seconds.

`src/lib/weather.ts` handles requests, response validation, caching and WMO condition codes. `src/components/WeatherCard.vue` handles presentation and discards late results after coordinates change or the card unmounts.

These are estimates from weather models, not measurements from a sensor at the attraction. Nearby destinations may have similar conditions. See the [Open-Meteo API documentation](https://open-meteo.com/en/docs).

## Bad-weather warnings

The weather card shows an accessible warning on the destination page when the current response indicates adverse conditions. Each warning names the affected tourist spot and uses that spot's saved latitude and longitude. Multiple concerns (such as thunderstorms and wind) are shown together. One spot's warning does not trigger warnings for other spots; each location's response is evaluated independently. Nearby spots may still receive similar weather estimates from the provider.

| Trigger | App display |
| --- | --- |
| Thunderstorms (WMO codes 95, 96, 97, 99), heavy rain/intense showers (65, 82), snow or freezing precipitation (56, 57, 66, 67, 71, 73, 75, 77, 85, 86) | Red warning |
| Rain/drizzle (51, 53, 55, 61, 63, 80, 81) or fog (45, 48) | Amber caution |
| Wind at least 40 km/h and below 60 km/h | Amber caution |
| Wind at least 60 km/h | Red warning |

Wind thresholds are app defaults in `src/lib/weatherWarnings.ts`, not official PAGASA warning criteria. Rain intensity comes from the WMO code; the app does not treat the current precipitation total as an hourly rainfall rate. Missing or unknown conditions do not create a weather-code warning, but known strong wind can still trigger one. No warning should be interpreted as an assurance of safe conditions.

Warnings use the same weather response, timestamp and cache as the card. They appear when the destination weather loads; this feature does not send phone/browser notifications or monitor weather after the app is closed. The warning links to [PAGASA](https://www.pagasa.dost.gov.ph/) for official updates and identifies itself as an app advisory based on estimates.

The card links to Open-Meteo for attribution. The free endpoint is for noncommercial use within the provider's limits; commercial deployment requires reviewing [Open-Meteo's subscription options](https://open-meteo.com/en/pricing).
