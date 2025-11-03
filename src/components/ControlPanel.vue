<template>
  <div class="control-panel">
    <div class="panel-header">
      <h2>地铁路径查询</h2>
    </div>

    <div class="panel-section">
      <h3>导入数据</h3>
      <div class="file-input-wrapper">
        <input
          type="file"
          accept=".json"
          @change="handleFileImport"
          id="file-input"
          class="file-input"
        />
        <label for="file-input" class="file-label">
          <span>📁</span> 选择JSON文件
        </label>
      </div>
      <button @click="loadDefaultData" class="btn btn-secondary">
        加载默认数据
      </button>
    </div>

    <div v-if="subwayData" class="panel-section">
      <h3>路径查询</h3>
      
      <div class="form-group">
        <label>起始站：</label>
        <select v-model="startStation" class="select-input">
          <option value="">请选择起始站</option>
          <option
            v-for="station in subwayData.stations"
            :key="station.id"
            :value="station.id"
          >
            {{ station.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>终点站：</label>
        <select v-model="endStation" class="select-input">
          <option value="">请选择终点站</option>
          <option
            v-for="station in subwayData.stations"
            :key="station.id"
            :value="station.id"
          >
            {{ station.name }}
          </option>
        </select>
      </div>

      <button
        @click="findPath"
        :disabled="!startStation || !endStation"
        class="btn btn-primary"
      >
        查询路径
      </button>
    </div>

    <div v-if="pathResult" class="panel-section result-section">
      <h3>查询结果</h3>
      
      <div class="result-item">
        <strong>总距离：</strong> {{ pathResult.totalDistance.toFixed(2) }} 单位
      </div>
      
      <div class="result-item">
        <strong>途经线路：</strong>
        <span class="lines">{{ pathResult.lines.join('、') }}</span>
      </div>
      
      <div class="result-item">
        <strong>途经站点（{{ pathResult.stations.length }}站）：</strong>
        <ol class="station-list">
          <li v-for="station in pathResult.stations" :key="station.id">
            {{ station.name }}
          </li>
        </ol>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading" class="loading-message">
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SubwayData, PathResult } from '../types/subway';

interface Props {
  subwayData: SubwayData | null;
  loading: boolean;
  error: string | null;
}

interface Emits {
  (e: 'loadDefault'): void;
  (e: 'importFile', file: File): void;
  (e: 'findPath', startId: string, endId: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const startStation = ref('');
const endStation = ref('');
const pathResult = ref<PathResult | null>(null);

defineExpose({
  setPathResult: (result: PathResult | null) => {
    pathResult.value = result;
  }
});

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('importFile', file);
  }
}

function loadDefaultData() {
  emit('loadDefault');
}

function findPath() {
  if (!startStation.value || !endStation.value) return;
  
  if (startStation.value === endStation.value) {
    pathResult.value = null;
    alert('起始站和终点站不能相同！');
    return;
  }
  
  emit('findPath', startStation.value, endStation.value);
}
</script>

<style scoped>
.control-panel {
  background: rgba(30, 30, 40, 0.95);
  color: #fff;
  padding: 20px;
  border-radius: 8px;
  max-height: 100%;
  overflow-y: auto;
}

.panel-header h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #4fc3f7;
}

.panel-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #81c784;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #b0bec5;
}

.select-input {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.select-input:focus {
  outline: none;
  border-color: #4fc3f7;
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4fc3f7;
  color: #000;
}

.btn-primary:hover:not(:disabled) {
  background: #29b6f6;
}

.btn-secondary {
  background: #81c784;
  color: #000;
  margin-top: 10px;
}

.btn-secondary:hover {
  background: #66bb6a;
}

.file-input-wrapper {
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.file-label {
  display: block;
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.file-label:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #4fc3f7;
}

.file-label span {
  margin-right: 8px;
}

.result-section {
  background: rgba(76, 175, 80, 0.1);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.result-item {
  margin-bottom: 15px;
}

.result-item strong {
  color: #81c784;
}

.lines {
  color: #fff;
}

.station-list {
  margin: 10px 0 0 0;
  padding-left: 20px;
  color: #e0e0e0;
}

.station-list li {
  margin-bottom: 5px;
}

.error-message {
  background: rgba(244, 67, 54, 0.2);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid rgba(244, 67, 54, 0.5);
  color: #ff8a80;
}

.loading-message {
  text-align: center;
  color: #4fc3f7;
  padding: 10px;
}

/* Scrollbar styling */
.control-panel::-webkit-scrollbar {
  width: 8px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
