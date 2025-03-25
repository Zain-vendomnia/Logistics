// src/services/geocodeService.ts
import axios from 'axios';

interface Coordinates {
  lat: string;
  lon: string;
}

export class GeocodeService {
  // Function to get latitude and longitude from an address
  async getCoordinates(address: string): Promise<Coordinates | null> {
    const baseUrl = 'https://nominatim.openstreetmap.org/search';
    const url = `${baseUrl}?format=json&q=${encodeURIComponent(address)}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Geocoder/jishi.puthanpurayil@vendomnia.com', 
        }
      });

      console.log(`Request to Nominatim for address: ${address}`);
      console.log('Response from Nominatim:', response.data);  

      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { lat, lon };
      } else {
        throw new Error(`No results found for address: ${address}`);
      }
    } catch (error) {
      console.error(`Error fetching geocode data for ${address}:`, error);
      return null;
    }
  }

  // Function to get lat/lng for a list of addresses
  async getLatLongForAddresses(addresses: string[]): Promise<{ address: string, lat: string, lon: string }[]> {
    const results = [];

    for (const address of addresses) {
      const coordinates = await this.getCoordinates(address);
      if (coordinates) {
        results.push({ address, lat: coordinates.lat, lon: coordinates.lon });
      }
    }

    return results;
  }
}
