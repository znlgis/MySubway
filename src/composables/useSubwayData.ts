import { ref } from 'vue';
import type { SubwayData, PathResult } from '../types/subway';
import { findShortestPath } from '../utils/pathfinding';

export function useSubwayData() {
  const subwayData = ref<SubwayData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Load subway data from JSON
   */
  async function loadSubwayData(jsonData?: SubwayData) {
    loading.value = true;
    error.value = null;

    try {
      if (jsonData) {
        // Load from provided data
        subwayData.value = jsonData;
      } else {
        // Load from default file
        const response = await fetch('/subway-data.json');
        if (!response.ok) {
          throw new Error('Failed to load subway data');
        }
        subwayData.value = await response.json();
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error loading subway data:', e);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Import subway data from file
   */
  async function importSubwayDataFromFile(file: File): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as SubwayData;
      
      // Basic validation
      if (!data.stations || !data.lines) {
        throw new Error('Invalid subway data format');
      }
      
      subwayData.value = data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error';
      console.error('Error importing subway data:', e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Find shortest path between two stations
   */
  function getShortestPath(startStationId: string, endStationId: string): PathResult | null {
    if (!subwayData.value) {
      return null;
    }
    return findShortestPath(subwayData.value, startStationId, endStationId);
  }

  return {
    subwayData,
    loading,
    error,
    loadSubwayData,
    importSubwayDataFromFile,
    getShortestPath
  };
}
