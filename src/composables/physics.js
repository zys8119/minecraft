import { BLOCK_TYPES, BOUNDARY_TYPE } from './blockTypes.js'

// 物理常量
export const GRAVITY = -24
export const WALK_SPEED = 5
export const SPRINT_SPEED = 8.5
export const JUMP_SPEED = 8.5
export const EYE_HEIGHT = 1.62
export const PLAYER_HEIGHT = 1.8
export const PLAYER_HALF = 0.3

/**
 * 判断位置是否为实心方块（可碰撞）
 */
export function isSolid(x, y, z, getBlock) {
  const type = getBlock(Math.floor(x), Math.floor(y), Math.floor(z))
  if (!type) return false
  if (type === BOUNDARY_TYPE) return false
  return BLOCK_TYPES[type] ? BLOCK_TYPES[type].solid : true
}

/**
 * 玩家 AABB 包围盒是否与某个实心方块重叠
 */
export function collidesAt(px, py, pz, getBlock) {
  const minX = Math.floor(px - PLAYER_HALF)
  const maxX = Math.floor(px + PLAYER_HALF)
  const minY = Math.floor(py)
  const maxY = Math.floor(py + PLAYER_HEIGHT)
  const minZ = Math.floor(pz - PLAYER_HALF)
  const maxZ = Math.floor(pz + PLAYER_HALF)
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (isSolid(x, y, z, getBlock)) return true
      }
    }
  }
  return false
}

/**
 * x/z 轴子步进移动：用包围盒逐轴检测，撞墙则吸附到方块边界
 */
export function stepMoveXZ(player, dt, getBlock) {
  const step = 0.2

  // X 轴
  const dx = player.velocity.x * dt
  const stepsX = Math.max(1, Math.ceil(Math.abs(dx) / step))
  const dxPerStep = dx / stepsX
  for (let i = 0; i < stepsX; i++) {
    player.position.x += dxPerStep
    if (collidesAt(player.position.x, player.position.y, player.position.z, getBlock)) {
      if (dxPerStep > 0) {
        player.position.x = Math.floor(player.position.x + PLAYER_HALF) - PLAYER_HALF - 0.001
      } else if (dxPerStep < 0) {
        player.position.x = Math.floor(player.position.x - PLAYER_HALF) + 1 + PLAYER_HALF + 0.001
      }
      player.velocity.x = 0
      break
    }
  }

  // Z 轴
  const dz = player.velocity.z * dt
  const stepsZ = Math.max(1, Math.ceil(Math.abs(dz) / step))
  const dzPerStep = dz / stepsZ
  for (let i = 0; i < stepsZ; i++) {
    player.position.z += dzPerStep
    if (collidesAt(player.position.x, player.position.y, player.position.z, getBlock)) {
      if (dzPerStep > 0) {
        player.position.z = Math.floor(player.position.z + PLAYER_HALF) - PLAYER_HALF - 0.001
      } else if (dzPerStep < 0) {
        player.position.z = Math.floor(player.position.z - PLAYER_HALF) + 1 + PLAYER_HALF + 0.001
      }
      player.velocity.z = 0
      break
    }
  }
}

/**
 * y 轴子步进移动：把单帧竖直位移拆成小块，避免高速穿透方块
 */
export function stepMoveY(player, dt, getBlock) {
  const totalDy = player.velocity.y * dt
  const step = 0.2
  const steps = Math.max(1, Math.ceil(Math.abs(totalDy) / step))
  const dyPerStep = totalDy / steps

  for (let i = 0; i < steps; i++) {
    player.position.y += dyPerStep
    if (collidesAt(player.position.x, player.position.y, player.position.z, getBlock)) {
      if (player.velocity.y < 0) {
        player.position.y = Math.floor(player.position.y) + 1 + 0.001
        player.onGround = true
      } else if (player.velocity.y > 0) {
        player.position.y = Math.floor(player.position.y) - 0.001
      }
      player.velocity.y = 0
      return
    }
  }
  if (player.velocity.y < 0) {
    player.onGround = false
  }
}
