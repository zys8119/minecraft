// 方块类型表：id -> 名称、颜色、特性
// solid: 是否实心（false 表示可穿过，如火焰）
// transparent: 是否透明（玻璃）
// emissive: 是否自发光（火焰）
export const BLOCK_TYPES = {
  1: {
    name: '草坪',
    base: '#7cb342',
    dark: '#558b2f',
    solid: true,
    transparent: false,
    emissive: false,
  },
  2: {
    name: '泥土',
    base: '#8d6e63',
    dark: '#6d4c41',
    solid: true,
    transparent: false,
    emissive: false,
  },
  3: {
    name: '石头',
    base: '#9e9e9e',
    dark: '#757575',
    solid: true,
    transparent: false,
    emissive: false,
  },
  4: {
    name: '铁块',
    base: '#b0bec5',
    dark: '#78909c',
    solid: true,
    transparent: false,
    emissive: false,
  },
  5: {
    name: '玻璃',
    base: '#c8e6ff',
    dark: '#e3f2fd',
    solid: true,
    transparent: true,
    emissive: false,
  },
  6: {
    name: '火焰',
    base: '#ff9800',
    dark: '#f57c00',
    solid: false,
    transparent: true,
    emissive: true,
  },
  7: {
    name: '边界',
    base: '#000000',
    dark: '#000000',
    solid: false,
    transparent: true,
    emissive: false,
    boundary: true,
  },
}

// 可在 HUD 中切换的方块（按数字键 1-6 选择，不包含边界辅助方块 7）
export const SELECTABLE_TYPES = [1, 4, 5, 2, 3, 6]

// 方块贴图路径：本地 public/textures 下的网络图片
export const TEXTURE_PATHS = {
  1: '/textures/grass.png',
  2: '/textures/dirt.png',
  3: '/textures/stone.jpg',
  4: '/textures/iron.jpg',
  5: '/textures/glass.jpg',
  6: '/textures/flame.jpg',
  7: '/textures/grass.png',
}

export const BOUNDARY_TYPE = 7
