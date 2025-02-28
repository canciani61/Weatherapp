import { Router, type Request, type Response } from 'express';
const router = Router();

import HistoryService from '../../service/historyService.js';
import WeatherService from '../../service/weatherService.js';

// POST Request with city name to retrieve weather data
router.post('/', async (req: Request, res: Response) => {
  try {
    const { city } = req.body;
    
    if (!city) {
      return res.status(400).json({ message: 'City name is required' });
    }
    
    // Get weather data from city name
    const weatherData = await WeatherService.getWeatherForCity(city);
    
    // Save city to search history
    const savedCity = await HistoryService.addCity(weatherData.cityName);
    
    // Return weather data along with city info
    return res.status(200).json({
      city: savedCity,
      weather: weatherData.forecast
    });
  } catch (error) {
    console.error('Error in weather route:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to get weather data' 
    });
  }
});

// GET search history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const cities = await HistoryService.getCities();
    return res.status(200).json(cities);
  } catch (error) {
    console.error('Error getting search history:', error);
    return res.status(500).json({ message: 'Failed to get search history' });
  }
});

// DELETE city from search history
router.delete('/history/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await HistoryService.removeCity(id);
    
    if (result) {
      return res.status(200).json({ message: 'City removed from history' });
    } else {
      return res.status(404).json({ message: 'City not found in history' });
    }
  } catch (error) {
    console.error('Error deleting city from history:', error);
    return res.status(500).json({ message: 'Failed to delete city from history' });
  }
});

export default router;
