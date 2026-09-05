import * as THREE from 'three'

/**
 * DDA 体素射线检测：返回命中的方块与命中面法线
 */
export function raycastBlock(camera, getBlock, maxDist = 15) {
  const origin = camera.position.clone()
  const dir = camera.getWorldDirection(new THREE.Vector3())

  let x = Math.floor(origin.x)
  let y = Math.floor(origin.y)
  let z = Math.floor(origin.z)

  const stepX = dir.x > 0 ? 1 : -1
  const stepY = dir.y > 0 ? 1 : -1
  const stepZ = dir.z > 0 ? 1 : -1

  const tDeltaX = Math.abs(1 / dir.x)
  const tDeltaY = Math.abs(1 / dir.y)
  const tDeltaZ = Math.abs(1 / dir.z)

  let tMaxX = dir.x !== 0 ? (stepX > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX : Infinity
  let tMaxY = dir.y !== 0 ? (stepY > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY : Infinity
  let tMaxZ = dir.z !== 0 ? (stepZ > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ : Infinity

  let normal = null
  let t = 0

  while (t <= maxDist) {
    if (getBlock(x, y, z)) {
      return { x, y, z, normal: normal || new THREE.Vector3(0, -1, 0) }
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX
      t = tMaxX
      tMaxX += tDeltaX
      normal = new THREE.Vector3(-stepX, 0, 0)
    } else if (tMaxY < tMaxZ) {
      y += stepY
      t = tMaxY
      tMaxY += tDeltaY
      normal = new THREE.Vector3(0, -stepY, 0)
    } else {
      z += stepZ
      t = tMaxZ
      tMaxZ += tDeltaZ
      normal = new THREE.Vector3(0, 0, -stepZ)
    }
  }
  return null
}

// 面名称列表
export const FACE_NAMES = ['right', 'left', 'top', 'bottom', 'front', 'back']

// 面的位置偏移
export const FACE_POSITIONS = {
  right: [0.5, 0, 0],
  left: [-0.5, 0, 0],
  top: [0, 0.5, 0],
  bottom: [0, -0.5, 0],
  front: [0, 0, 0.5],
  back: [0, 0, -0.5],
}

// 面的旋转
export const FACE_ROTATIONS = {
  right: [0, Math.PI / 2, 0],
  left: [0, -Math.PI / 2, 0],
  top: [-Math.PI / 2, 0, 0],
  bottom: [Math.PI / 2, 0, 0],
  front: [0, 0, 0],
  back: [0, Math.PI, 0],
}

// 法线方向到面名称的映射
export const NORMAL_TO_FACE = {
  '1,0,0': 'right',
  '-1,0,0': 'left',
  '0,1,0': 'top',
  '0,-1,0': 'bottom',
  '0,0,1': 'front',
  '0,0,-1': 'back',
}
