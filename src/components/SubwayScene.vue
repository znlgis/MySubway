<template>
  <div class="scene-wrapper">
    <canvas ref="canvasRef" class="babylon-canvas"></canvas>
    <div v-if="selectedStation" class="station-info-panel">
      <div class="info-header">
        <h3>{{ selectedStation.name }}</h3>
        <button @click="closeStationInfo" class="close-btn">✕</button>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="info-label">所属线路：</span>
          <div class="lines-list">
            <span 
              v-for="line in getStationLines(selectedStation.id)" 
              :key="line.id"
              class="line-badge"
              :style="{ backgroundColor: line.color }"
            >
              {{ line.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import type { SubwayData, PathResult, Station } from '../types/subway';

interface Props {
  subwayData: SubwayData | null;
  highlightedPath?: PathResult | null;
}

const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const selectedStation = ref<Station | null>(null);
let engine: BABYLON.Engine | null = null;
let scene: BABYLON.Scene | null = null;
let camera: BABYLON.ArcRotateCamera | null = null;
let stationMeshes = new Map<string, BABYLON.Mesh>();
let lineMeshes: BABYLON.Mesh[] = [];
let pathMeshes: BABYLON.Mesh[] = [];
let stationDataMap = new Map<string, Station>();

onMounted(() => {
  if (!canvasRef.value) return;

  // Create Babylon.js engine and scene
  engine = new BABYLON.Engine(canvasRef.value, true);
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

  // Create camera
  camera = new BABYLON.ArcRotateCamera(
    'camera',
    Math.PI / 2,
    Math.PI / 3,
    30,
    BABYLON.Vector3.Zero(),
    scene
  );
  camera.attachControl(canvasRef.value, true);
  camera.lowerRadiusLimit = 10;
  camera.upperRadiusLimit = 100;

  // Create light
  const light = new BABYLON.HemisphericLight(
    'light',
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  light.intensity = 0.7;

  // Render loop
  engine.runRenderLoop(() => {
    scene?.render();
  });

  // Handle window resize
  window.addEventListener('resize', handleResize);

  // Initial render
  if (props.subwayData) {
    renderSubwayNetwork(props.subwayData);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  engine?.dispose();
});

watch(() => props.subwayData, (newData) => {
  if (newData) {
    renderSubwayNetwork(newData);
  }
});

watch(() => props.highlightedPath, (newPath) => {
  if (newPath !== undefined) {
    highlightPath(newPath);
  }
});

function handleResize() {
  engine?.resize();
}

function renderSubwayNetwork(data: SubwayData) {
  if (!scene) return;

  // Clear existing meshes
  stationMeshes.forEach(mesh => mesh.dispose());
  stationMeshes.clear();
  lineMeshes.forEach(mesh => mesh.dispose());
  lineMeshes = [];
  
  // Clear station data map
  stationDataMap.clear();

  // Create station meshes
  data.stations.forEach(station => {
    // Store station data
    stationDataMap.set(station.id, station);
    
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `station-${station.id}`,
      { diameter: 0.5 },
      scene!
    );
    sphere.position = new BABYLON.Vector3(
      station.position.x,
      station.position.y,
      station.position.z
    );

    const material = new BABYLON.StandardMaterial(`mat-${station.id}`, scene!);
    material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    sphere.material = material;
    
    // Make station clickable
    sphere.isPickable = true;
    sphere.actionManager = new BABYLON.ActionManager(scene!);
    sphere.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => {
          handleStationClick(station.id);
        }
      )
    );
    
    // Add hover effect
    sphere.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => {
          const mat = sphere.material as BABYLON.StandardMaterial;
          if (!isStationHighlighted(station.id)) {
            mat.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
          }
          document.body.style.cursor = 'pointer';
        }
      )
    );
    
    sphere.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        () => {
          const mat = sphere.material as BABYLON.StandardMaterial;
          if (!isStationHighlighted(station.id)) {
            mat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
          }
          document.body.style.cursor = 'default';
        }
      )
    );

    stationMeshes.set(station.id, sphere);
  });

  // Create line meshes
  data.lines.forEach(line => {
    const lineColor = hexToColor3(line.color);

    for (let i = 0; i < line.stations.length - 1; i++) {
      const station1 = data.stations.find(s => s.id === line.stations[i]);
      const station2 = data.stations.find(s => s.id === line.stations[i + 1]);

      if (station1 && station2) {
        const points = [
          new BABYLON.Vector3(station1.position.x, station1.position.y, station1.position.z),
          new BABYLON.Vector3(station2.position.x, station2.position.y, station2.position.z)
        ];

        const tube = BABYLON.MeshBuilder.CreateTube(
          `line-${line.id}-${i}`,
          { path: points, radius: 0.1, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
          scene!
        );

        const material = new BABYLON.StandardMaterial(`mat-line-${line.id}-${i}`, scene!);
        material.diffuseColor = lineColor;
        material.emissiveColor = lineColor.scale(0.3);
        tube.material = material;

        lineMeshes.push(tube);
      }
    }
  });

  // Adjust camera target to center of network
  if (camera && data.stations.length > 0) {
    const avgX = data.stations.reduce((sum, s) => sum + s.position.x, 0) / data.stations.length;
    const avgY = data.stations.reduce((sum, s) => sum + s.position.y, 0) / data.stations.length;
    const avgZ = data.stations.reduce((sum, s) => sum + s.position.z, 0) / data.stations.length;
    camera.target = new BABYLON.Vector3(avgX, avgY, avgZ);
  }
}

function highlightPath(pathResult: PathResult | null) {
  if (!scene) return;

  // Clear existing path meshes
  pathMeshes.forEach(mesh => mesh.dispose());
  pathMeshes = [];

  // Reset all stations to default color
  stationMeshes.forEach(mesh => {
    const material = mesh.material as BABYLON.StandardMaterial;
    material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  });

  if (!pathResult || pathResult.stations.length < 2) return;

  // Highlight stations in the path
  pathResult.stations.forEach(station => {
    const mesh = stationMeshes.get(station.id);
    if (mesh) {
      const material = mesh.material as BABYLON.StandardMaterial;
      material.diffuseColor = new BABYLON.Color3(1, 0.84, 0);
      material.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0);
    }
  });

  // Create highlighted path lines
  for (let i = 0; i < pathResult.stations.length - 1; i++) {
    const station1 = pathResult.stations[i];
    const station2 = pathResult.stations[i + 1];

    if (!station1 || !station2) continue;
    
    const points = [
      new BABYLON.Vector3(station1.position.x, station1.position.y, station1.position.z),
      new BABYLON.Vector3(station2.position.x, station2.position.y, station2.position.z)
    ];

    const tube = BABYLON.MeshBuilder.CreateTube(
      `path-${i}`,
      { path: points, radius: 0.2, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
      scene!
    );

    const material = new BABYLON.StandardMaterial(`mat-path-${i}`, scene!);
    material.diffuseColor = new BABYLON.Color3(1, 0.27, 0);
    material.emissiveColor = new BABYLON.Color3(1, 0.4, 0);
    material.alpha = 0.9;
    tube.material = material;

    pathMeshes.push(tube);
  }
}

function hexToColor3(hex: string): BABYLON.Color3 {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return new BABYLON.Color3(
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    );
  }
  return new BABYLON.Color3(1, 1, 1);
}

function handleStationClick(stationId: string) {
  const station = stationDataMap.get(stationId);
  if (station) {
    selectedStation.value = station;
  }
}

function closeStationInfo() {
  selectedStation.value = null;
}

function isStationHighlighted(stationId: string): boolean {
  if (!props.highlightedPath) return false;
  return props.highlightedPath.stations.some(s => s.id === stationId);
}

function getStationLines(stationId: string) {
  if (!props.subwayData) return [];
  return props.subwayData.lines.filter(line => 
    line.stations.includes(stationId)
  );
}
</script>

<style scoped>
.scene-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.babylon-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.station-info-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(30, 30, 40, 0.95);
  border-radius: 8px;
  padding: 20px;
  min-width: 280px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  color: #fff;
  z-index: 10;
  backdrop-filter: blur(10px);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4fc3f7;
}

.info-header h3 {
  margin: 0;
  font-size: 20px;
  color: #4fc3f7;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-label {
  font-size: 12px;
  color: #b0bec5;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: #fff;
  font-weight: 400;
}

.lines-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.line-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
