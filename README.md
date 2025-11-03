# MySubway

基于VUE3和Babylon.js开发的地铁小游戏。

## 功能特性

- 🚇 3D地铁线路可视化
- 📊 支持导入JSON格式的地铁数据
- 🔍 起始站和终点站最短路径查询
- 🎨 交互式3D场景（支持缩放、旋转）
- 📍 路径高亮显示

## 技术栈

- Vue 3 - 渐进式JavaScript框架
- TypeScript - 类型安全
- Babylon.js - 3D图形引擎
- Vite - 快速构建工具

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 使用说明

### 导入地铁数据

应用支持两种方式导入地铁数据：

1. **使用默认数据**：点击"加载默认数据"按钮加载示例地铁网络
2. **导入JSON文件**：点击"选择JSON文件"上传自定义地铁数据

### JSON数据格式

地铁数据应遵循以下JSON格式：

```json
{
  "stations": [
    {
      "id": "s1",
      "name": "站点名称",
      "position": { "x": 0, "y": 0, "z": 0 }
    }
  ],
  "lines": [
    {
      "id": "line1",
      "name": "1号线",
      "color": "#FF0000",
      "stations": ["s1", "s2", "s3"]
    }
  ]
}
```

### 查询路径

1. 在"起始站"下拉框选择出发站点
2. 在"终点站"下拉框选择目的站点
3. 点击"查询路径"按钮
4. 系统将显示最短路径，包括：
   - 总距离
   - 途经线路
   - 途经站点列表
   - 3D场景中的路径高亮

## 项目结构

```
src/
├── components/
│   ├── SubwayScene.vue      # Babylon.js 3D场景组件
│   └── ControlPanel.vue     # 控制面板组件
├── composables/
│   └── useSubwayData.ts     # 地铁数据管理
├── types/
│   └── subway.ts            # TypeScript类型定义
├── utils/
│   └── pathfinding.ts       # 最短路径算法（Dijkstra）
├── App.vue                  # 主应用组件
└── main.ts                  # 应用入口

public/
└── subway-data.json         # 默认地铁数据
```

## 算法说明

本项目使用 **Dijkstra算法** 计算两个站点之间的最短路径：

- 将地铁网络建模为加权无向图
- 站点为图的节点
- 线路连接为图的边
- 边的权重为两站点之间的欧几里得距离
- 支持跨线路换乘

## License

MIT
