import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

// Define an interface for the Coordinates object
interface Coordinates {
  lat: number;
  lon: number;
  name: string;
}

// Define a class for the Weather object
class Weather {
  constructor(
    public date: Date,
    public temperature: number,
    public humidity: number, 
    public windSpeed: number,
    public description: string,
    public icon: string
  ) {}
}

// Complete the WeatherService class
class WeatherService {
  private baseURL = 'https://api.openweathermap.org/data/2.5';
  private geocodeURL = 'https://api.openweathermap.org/geo/1.0/direct';
  private apiKey = process.env.OPENWEATHER_API_KEY;
  private cityName: string = '';

  // Fetch location data (coordinates) from OpenWeather API
  private async fetchLocationData(query: string): Promise<any> {
    try {
      const response = await axios.get(this.buildGeocodeQuery(query));
      if (response.data.length === 0) {
        throw new Error('City not found');
      }
      return response.data[0];
    } catch (error) {
      console.error('Error fetching location data:', error);
      throw error;
    }
  }

  // Extract coordinates from location data
  private destructureLocationData(locationData: any): Coordinates {
    return {
      lat: locationData.lat,
      lon: locationData.lon,
      name: locationData.name
    };
  }

  // Build geocode API query URL
  private buildGeocodeQuery(query: string): string {
    return `${this.geocodeURL}?q=${encodeURIComponent(query)}&limit=1&appid=${this.apiKey}`;
  }

  // Build weather API query URL
  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&units=imperial&appid=${this.apiKey}`;
  }

  // Fetch and format location data in one step
  private async fetchAndDestructureLocationData(city: string): Promise<Coordinates> {
    const locationData = await this.fetchLocationData(city);
    this.cityName = locationData.name;
    return this.destructureLocationData(locationData);
  }

  // Fetch weather data from OpenWeather API
  private async fetchWeatherData(coordinates: Coordinates): Promise<any> {
    try {
      const response = await axios.get(this.buildWeatherQuery(coordinates));
      return response.data;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw error;
    }
  }

  // Parse current weather data
  private parseCurrentWeather(weatherData: any): Weather {
    const currentData = weatherData.list[0];
    return new Weather(
      new Date(currentData.dt * 1000),
      currentData.main.temp,
      currentData.main.humidity,
      currentData.wind.speed,
      currentData.weather[0].description,
      currentData.weather[0].icon
    );
  }

  // Build forecast array for 5 days
  private buildForecastArray(currentWeather: Weather, weatherData: any): Weather[] {
    const forecast: Weather[] = [currentWeather];
    
    // Get one data point per day (noon) for the next 5 days
    const uniqueDays = new Set<string>();
    const currentDate = new Date(currentWeather.date);
    uniqueDays.add(currentDate.toDateString());
    
    for (const item of weatherData.list) {
      const date = new Date(item.dt * 1000);
      const dateString = date.toDateString();
      
      // Check if we already have this day and if it's close to noon (between 11AM and 2PM)
      if (!uniqueDays.has(dateString) && date.getHours() >= 11 && date.getHours() <= 14) {
        uniqueDays.add(dateString);
        forecast.push(new Weather(
          date,
          item.main.temp,
          item.main.humidity,
          item.wind.speed,
          item.weather[0].description,
          item.weather[0].icon
        ));
        
        // Stop if we have 5 days total
        if (forecast.length >= 5) break;
      }
    }
    
    return forecast;
  }

  // Get weather for a city
  async getWeatherForCity(city: string): Promise<{ cityName: string, forecast: Weather[] }> {
    try {
      const coordinates = await this.fetchAndDestructureLocationData(city);
      const weatherData = await this.fetchWeatherData(coordinates);
      
      const currentWeather = this.parseCurrentWeather(weatherData);
      const forecast = this.buildForecastArray(currentWeather, weatherData);
      
      return {
        cityName: this.cityName,
        forecast
      };
    } catch (error) {
      console.error('Error in getWeatherForCity:', error);
      throw error;
    }
  }
}

export default new WeatherService();