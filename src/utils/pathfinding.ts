import type { Station, SubwayData, PathResult } from '../types/subway';

/**
 * Calculate distance between two stations
 */
function calculateDistance(station1: Station, station2: Station): number {
  const dx = station1.position.x - station2.position.x;
  const dy = station1.position.y - station2.position.y;
  const dz = station1.position.z - station2.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Build a graph from subway data
 */
function buildGraph(subwayData: SubwayData): Map<string, Map<string, number>> {
  const graph = new Map<string, Map<string, number>>();
  
  // Initialize graph with all stations
  subwayData.stations.forEach(station => {
    graph.set(station.id, new Map());
  });
  
  // Add edges based on lines
  subwayData.lines.forEach(line => {
    for (let i = 0; i < line.stations.length - 1; i++) {
      const currentStationId = line.stations[i];
      const nextStationId = line.stations[i + 1];
      
      if (!currentStationId || !nextStationId) continue;
      
      const currentStation = subwayData.stations.find(s => s.id === currentStationId);
      const nextStation = subwayData.stations.find(s => s.id === nextStationId);
      
      if (currentStation && nextStation) {
        const distance = calculateDistance(currentStation, nextStation);
        
        // Add bidirectional edges
        graph.get(currentStationId)!.set(nextStationId, distance);
        graph.get(nextStationId)!.set(currentStationId, distance);
      }
    }
  });
  
  return graph;
}

/**
 * Find shortest path using Dijkstra's algorithm
 */
export function findShortestPath(
  subwayData: SubwayData,
  startStationId: string,
  endStationId: string
): PathResult | null {
  const graph = buildGraph(subwayData);
  
  // Verify start and end stations exist
  if (!graph.has(startStationId) || !graph.has(endStationId)) {
    return null;
  }
  
  // Initialize distances and previous stations
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();
  
  subwayData.stations.forEach(station => {
    distances.set(station.id, Infinity);
    previous.set(station.id, null);
    unvisited.add(station.id);
  });
  
  distances.set(startStationId, 0);
  
  // Dijkstra's algorithm
  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let currentNode: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      const distance = distances.get(nodeId)!;
      if (distance < minDistance) {
        minDistance = distance;
        currentNode = nodeId;
      }
    });
    
    if (currentNode === null || minDistance === Infinity) {
      break;
    }
    
    // Found the destination
    if (currentNode === endStationId) {
      break;
    }
    
    unvisited.delete(currentNode);
    
    // Update distances to neighbors
    const neighbors = graph.get(currentNode)!;
    neighbors.forEach((edgeDistance, neighborId) => {
      if (unvisited.has(neighborId)) {
        const newDistance = distances.get(currentNode!)! + edgeDistance;
        if (newDistance < distances.get(neighborId)!) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, currentNode);
        }
      }
    });
  }
  
  // Reconstruct path
  const path: string[] = [];
  let current: string | null = endStationId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }
  
  // If path doesn't start with startStationId, no path exists
  if (path[0] !== startStationId) {
    return null;
  }
  
  // Get station objects for the path
  const pathStations = path
    .map(id => subwayData.stations.find(s => s.id === id))
    .filter((s): s is Station => s !== undefined);
  
  // Find which lines are used in the path
  const linesUsed = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) {
    const currentId = path[i];
    const nextId = path[i + 1];
    
    if (!currentId || !nextId) continue;
    
    subwayData.lines.forEach(line => {
      const currentIndex = line.stations.indexOf(currentId);
      const nextIndex = line.stations.indexOf(nextId);
      
      if (currentIndex !== -1 && nextIndex !== -1 && Math.abs(currentIndex - nextIndex) === 1) {
        linesUsed.add(line.name);
      }
    });
  }
  
  return {
    stations: pathStations,
    totalDistance: distances.get(endStationId)!,
    lines: Array.from(linesUsed)
  };
}
