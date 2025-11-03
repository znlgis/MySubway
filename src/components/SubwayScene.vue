<template>
  <canvas ref="canvasRef" class="babylon-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as BABYLON from '@babylonjs/core';
import type { SubwayData, PathResult } from '../types/subway';

interface Props {
  subwayData: SubwayData | null;
  highlightedPath?: PathResult | null;
}

const props = defineProps<Props>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let engine: BABYLON.Engine | null = null;
let scene: BABYLON.Scene | null = null;
let camera: BABYLON.ArcRotateCamera | null = null;
let stationMeshes = new Map<string, BABYLON.Mesh>();
let lineMeshes: BABYLON.Mesh[] = [];
let pathMeshes: BABYLON.Mesh[] = [];

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

  // Create station meshes
  data.stations.forEach(station => {
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

  if (!pathResult || pathResult.stations.length < 2) return;

  // Highlight stations in the path
  pathResult.stations.forEach(station => {
    const mesh = stationMeshes.get(station.id);
    if (mesh) {
      const material = mesh.material as BABYLON.StandardMaterial;
      material.diffuseColor = new BABYLON.Color3(1, 1, 0);
      material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0);
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
      { path: points, radius: 0.15, sideOrientation: BABYLON.Mesh.DOUBLESIDE },
      scene!
    );

    const material = new BABYLON.StandardMaterial(`mat-path-${i}`, scene!);
    material.diffuseColor = new BABYLON.Color3(1, 0.8, 0);
    material.emissiveColor = new BABYLON.Color3(0.8, 0.6, 0);
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
</script>

<style scoped>
.babylon-canvas {
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}
</style>
