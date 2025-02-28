import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define a City class with name and id properties
export class City {
  constructor(public name: string, public id: string = uuidv4()) {}
}

class HistoryService {
  private filePath = path.join(process.cwd(), 'searchHistory.json');

  // Read method that reads from the searchHistory.json file
  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as City[];
    } catch (error) {
      // If file doesn't exist or is empty, return empty array
      return [];
    }
  }

  // Write method that writes the updated cities array to the searchHistory.json file
  private async write(cities: City[]): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2), 'utf-8');
  }

  // Get cities method that reads the cities from the searchHistory.json file and returns them as an array of City objects
  async getCities(): Promise<City[]> {
    return await this.read();
  }

  // Add city method that adds a city to the searchHistory.json file
  async addCity(cityName: string): Promise<City> {
    const cities = await this.read();
    
    // Check if city already exists, return it if it does
    const existingCity = cities.find(city => city.name.toLowerCase() === cityName.toLowerCase());
    if (existingCity) {
      return existingCity;
    }
    
    // Create new city with unique ID
    const newCity = new City(cityName);
    cities.push(newCity);
    
    await this.write(cities);
    return newCity;
  }

  // Remove city method that removes a city from the searchHistory.json file
  async removeCity(id: string): Promise<boolean> {
    const cities = await this.read();
    const initialLength = cities.length;
    
    const filteredCities = cities.filter(city => city.id !== id);
    
    if (filteredCities.length === initialLength) {
      return false; // No city was removed
    }
    
    await this.write(filteredCities);
    return true; // City was successfully removed
  }
}

export default new HistoryService();