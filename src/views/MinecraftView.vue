<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useMinecraft } from '../composables/useMinecraft'

const canvasRef = ref(null)
const { isLocked, selectedType, selectableTypes, blockTypes, texturePaths, init, lock, saveWorld, resetWorld, toggleFullscreen, isFullscreen } =
  useMinecraft(canvasRef)

const saveStatus = ref('')
const resetConfirm = ref(false)

async function handleSave() {
  saveStatus.value = '保存中...'
  const success = await saveWorld()
  saveStatus.value = success ? '✅ 已保存' : '❌ 保存失败'
  setTimeout(() => {
    saveStatus.value = ''
  }, 2000)
}

function handleFullscreen() {
  toggleFullscreen()
}

async function handleReset() {
  if (!resetConfirm.value) {
    resetConfirm.value = true
    setTimeout(() => {
      resetConfirm.value = false
    }, 3000)
    return
  }
  resetConfirm.value = false
  const success = await resetWorld()
  if (success) {
    saveStatus.value = '✅ 已重置世界'
    setTimeout(() => {
      saveStatus.value = ''
    }, 2000)
  }
}

// 快捷键
function onKeyDown(e) {
  // F 键切换全屏
  if (e.key === 'f' || e.key === 'F') {
    e.preventDefault()
    toggleFullscreen()
  }
  // Ctrl+S 或 Alt+S 存档
  if ((e.ctrlKey || e.altKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    if (isLocked.value) {
      handleSave()
    }
  }
}

onMounted(() => {
  init()
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="game-root">
    <canvas ref="canvasRef" class="game-canvas" />

    <!-- 十字准星 -->
    <div v-if="isLocked" class="crosshair">
      <span class="crosshair-h" />
      <span class="crosshair-v" />
    </div>

    <!-- 未锁定时的开始界面 -->
    <div v-if="!isLocked" class="start-overlay">
      <div class="start-panel">
        <h1>我的世界 · 体素沙盒</h1>
        <p class="subtitle">一个用 Three.js 打造的小小方块世界</p>
        <button class="start-btn" @click="lock()">点击开始游戏</button>
        <ul class="controls">
          <li><kbd>W A S D</kbd> 移动</li>
          <li><kbd>空格</kbd> 跳跃 / <kbd>Shift</kbd> 疾跑</li>
          <li><kbd>鼠标</kbd> 视角</li>
          <li><kbd>左键</kbd> 破坏方块 / <kbd>右键</kbd> 放置方块</li>
          <li><kbd>1 - 6</kbd> 选择方块</li>
          <li><kbd>R</kbd> 回到出生点</li>
        </ul>
      </div>
    </div>

    <!-- 方块选择栏 -->
    <div v-if="isLocked" class="hotbar">
      <div v-for="(type, index) in selectableTypes" :key="type" class="hotbar-slot"
        :class="{ active: selectedType === type }" :style="{ borderColor: selectedType === type ? '#fff' : '#555' }">
        <span class="hotbar-swatch" :style="{
          backgroundImage: texturePaths[type] ? `url(${texturePaths[type]})` : 'none',
          backgroundColor: texturePaths[type] ? 'transparent' : blockTypes[type].base,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: blockTypes[type].transparent ? 0.6 : 1
        }" />
        <span class="hotbar-key">{{ index + 1 }}</span>
        <span class="hotbar-name">{{ blockTypes[type].name }}</span>
      </div>
    </div>

    <!-- 游戏内底部提示 -->
    <div v-if="isLocked" class="hud">
      <span>左键破坏 · 右键放置 · 数字键 1-6 选方块 · R 回出生点 · Esc 暂停 · F 全屏 · Ctrl+S 存档</span>
    </div>

    <!-- 存档按钮与全屏按钮 -->
    <div v-if="isLocked" class="action-buttons">
      <button class="action-btn save-btn" @click="handleSave" title="保存游戏 (Ctrl+S)">
        💾
      </button>
      <button class="action-btn reset-btn" @click="handleReset" :title="resetConfirm ? '再次点击确认重置' : '重置世界'">
        {{ resetConfirm ? '⚠️' : '🔄' }}
      </button>
      <button class="action-btn fullscreen-btn" @click="handleFullscreen" title="全屏 (F)">
        {{ isFullscreen() ? '⛶' : '⛶' }}
      </button>
      <span v-if="saveStatus" class="save-status">{{ saveStatus }}</span>
    </div>
  </div>
</template>

<style scoped>
.game-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #87ceeb;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* 十字准星 */
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.crosshair-h {
  position: absolute;
  width: 20px;
  height: 2px;
  background: rgba(255, 255, 255, 0.85);
  top: -1px;
  left: -10px;
  mix-blend-mode: difference;
}

.crosshair-v {
  position: absolute;
  width: 2px;
  height: 20px;
  background: rgba(255, 255, 255, 0.85);
  top: -10px;
  left: -1px;
  mix-blend-mode: difference;
}

/* 开始界面 */
.start-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 20, 24, 0.72);
  backdrop-filter: blur(4px);
  z-index: 10;
}

.start-panel {
  background: #1f1f26;
  color: #eee;
  padding: 2.5rem 3rem;
  border-radius: 16px;
  text-align: center;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.start-panel h1 {
  margin: 0 0 0.4rem;
  font-size: 1.9rem;
  color: #7cb342;
}

.subtitle {
  margin: 0 0 1.6rem;
  color: #aaa;
  font-size: 0.95rem;
}

.start-btn {
  background: #7cb342;
  color: #fff;
  border: none;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.start-btn:hover {
  background: #8bc34a;
  border-color: transparent;
}

.start-btn:active {
  transform: scale(0.97);
}

.controls {
  list-style: none;
  margin: 1.6rem 0 0;
  padding: 0;
  text-align: left;
  font-size: 0.9rem;
  color: #bbb;
  line-height: 2;
}

.controls kbd {
  display: inline-block;
  background: #333;
  border: 1px solid #555;
  border-bottom-width: 2px;
  border-radius: 4px;
  padding: 0 6px;
  font-size: 0.8rem;
  color: #fff;
  font-family: inherit;
}

/* 方块选择栏 */
.hotbar {
  position: fixed;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  z-index: 5;
  pointer-events: none;
}

.hotbar-slot {
  position: relative;
  width: 52px;
  height: 52px;
  border: 2px solid #555;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  transition: border-color 0.15s;
}

.hotbar-slot.active {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.15);
}

.hotbar-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.hotbar-key {
  position: absolute;
  top: 2px;
  left: 5px;
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
}

.hotbar-name {
  font-size: 0.62rem;
  color: #ddd;
  margin-top: 2px;
}

/* HUD */
.hud {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.45);
  color: #eee;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 5;
}

/* 操作按钮 */
.action-buttons {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 20;
  align-items: center;
}

.action-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-btn:hover {
  transform: scale(1.08);
  background: rgba(255, 255, 255, 0.2);
}

.action-btn:active {
  transform: scale(0.92);
}

.save-btn:hover {
  background: rgba(76, 175, 80, 0.5);
}

.reset-btn:hover {
  background: rgba(255, 152, 0, 0.5);
}

.fullscreen-btn:hover {
  background: rgba(33, 150, 243, 0.5);
}

.save-status {
  color: #fff;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 14px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  white-space: nowrap;
}
</style>
