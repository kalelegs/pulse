import { tool } from '@openai/agents';
import { z } from 'zod';

const getWeatherDescriptionFromCode = (weatherCode: number): string => {
  const weatherCodeMap: Record<number, string> = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    56: 'light freezing drizzle',
    57: 'dense freezing drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    66: 'light freezing rain',
    67: 'heavy freezing rain',
    71: 'slight snow fall',
    73: 'moderate snow fall',
    75: 'heavy snow fall',
    77: 'snow grains',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    85: 'slight snow showers',
    86: 'heavy snow showers',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail',
  };

  return weatherCodeMap[weatherCode] ?? 'unknown conditions';
};

const getWeather = tool({
  name: 'get_weather_for_city',
  description: 'Get current weather conditions for a given city.',
  parameters: z.object({
    city: z.string().describe('City name to get the weather for'),
  }),
  async execute({ city }, context, details) {
    console.log('weather tool called');
    const geocodingResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    );

    if (!geocodingResponse.ok) {
      return `Unable to fetch weather right now (geocoding failed with status ${geocodingResponse.status}).`;
    }

    const geocodingData = await geocodingResponse.json();
    const location = geocodingData.results?.[0];

    if (!location) {
      return `Could not find a city named "${city}".`;
    }

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`,
    );

    if (!weatherResponse.ok) {
      return `Unable to fetch weather right now (weather API failed with status ${weatherResponse.status}).`;
    }

    const weatherData = await weatherResponse.json();
    const current = weatherData.current;

    if (!current) {
      return `No current weather data available for "${location.name}".`;
    }

    const condition = getWeatherDescriptionFromCode(current.weather_code);
    return `Current weather in ${location.name}, ${location.country}: ${condition}, ${current.temperature_2m}°C (feels like ${current.apparent_temperature}°C), humidity ${current.relative_humidity_2m}%, wind ${current.wind_speed_10m} km/h.`;
  },
});

export default getWeather;
