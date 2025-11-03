<script setup lang="ts">
import { ref, onMounted } from 'vue';
import SubwayScene from './components/SubwayScene.vue';
import ControlPanel from './components/ControlPanel.vue';
import { useSubwayData } from './composables/useSubwayData';
import type { PathResult } from './types/subway';

const { subwayData, loading, error, loadSubwayData, getShortestPath } = useSubwayData();
const highlightedPath = ref<PathResult | null>(null);
const controlPanelRef = ref<InstanceType<typeof ControlPanel> | null>(null);

onMounted(() => {
  // Load default subway data on mount
  loadSubwayData();
});

function handleFindPath(startId: string, endId: string) {
  const result = getShortestPath(startId, endId);
  
  if (result) {
    highlightedPath.value = result;
    if (controlPanelRef.value) {
      controlPanelRef.value.setPathResult(result);
    }
  } else {
    highlightedPath.value = null;
    if (controlPanelRef.value) {
      controlPanelRef.value.setPathResult(null);
    }
    alert('未找到有效路径！');
  }
}

function handleClearPath() {
  highlightedPath.value = null;
  if (controlPanelRef.value) {
    controlPanelRef.value.setPathResult(null);
  }
}
</script>

<template>
  <div class="app-container">
    <div class="scene-container">
      <SubwayScene 
        :subway-data="subwayData" 
        :highlighted-path="highlightedPath"
      />
    </div>
    <div class="control-container">
      <ControlPanel
        ref="controlPanelRef"
        :subway-data="subwayData"
        :loading="loading"
        :error="error"
        @find-path="handleFindPath"
        @clear-path="handleClearPath"
      />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.scene-container {
  flex: 1;
  height: 100%;
  position: relative;
}

.control-container {
  width: 400px;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }
  
  .scene-container {
    height: 60%;
  }
  
  .control-container {
    width: 100%;
    height: 40%;
  }
}
</style>
