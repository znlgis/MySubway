// Subway data types
export interface Station {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Line {
  id: string;
  name: string;
  color: string;
  stations: string[];
}

export interface SubwayData {
  stations: Station[];
  lines: Line[];
}

export interface PathResult {
  stations: Station[];
  totalDistance: number;
  lines: string[];
}
