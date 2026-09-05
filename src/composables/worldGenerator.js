import { BLOCK_TYPES, BOUNDARY_TYPE } from './blockTypes.js'

export const WORLD_SIZE = 32
export const WORLD_HEIGHT = 24

/**
 * 生成地形：起伏的草地平原
 */
export function generateTerrain(voxels, getBlock, setBlock) {
  voxels.clear()
  for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
      const cx = x - WORLD_SIZE / 2
      const cz = z - WORLD_SIZE / 2
      const dist = Math.sqrt(cx * cx + cz * cz)
      const height =
        Math.floor(
          WORLD_HEIGHT / 2 +
            Math.sin(x * 0.35) * 2 +
            Math.cos(z * 0.3) * 2 +
            Math.sin((x + z) * 0.15) * 2.5 -
            Math.max(0, dist - 12) * 0.6
        ) + 1
      for (let y = 0; y <= height; y++) {
        let type
        if (y === height) type = 1
        else if (y >= height - 3) type = 2
        else type = 3
        setBlock(x, y, z, type)
      }
    }
  }
  generateBoundaryBlocks(voxels, getBlock, setBlock)
}

/**
 * 生成边界辅助方块：在真实砖块外侧且没有真实砖块的位置放置
 */
export function generateBoundaryBlocks(voxels, getBlock, setBlock) {
  const boundaryPositions = new Set()

  for (const [key, type] of voxels.entries()) {
    if (type === BOUNDARY_TYPE) continue

    const [x, y, z] = key.split(',').map(Number)
    const neighbors = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]

    for (const [dx, dy, dz] of neighbors) {
      const nx = x + dx
      const ny = y + dy
      const nz = z + dz

      const neighborType = getBlock(nx, ny, nz)
      if (neighborType && neighborType !== BOUNDARY_TYPE) continue
      if (getBlock(nx, ny, nz) === BOUNDARY_TYPE) continue

      const boundaryY = ny - 1
      if (boundaryY >= 0) {
        boundaryPositions.add(`${nx},${boundaryY},${nz}`)
      }
    }
  }

  for (const key of boundaryPositions) {
    const [x, y, z] = key.split(',').map(Number)
    if (!getBlock(x, y, z)) {
      setBlock(x, y, z, BOUNDARY_TYPE)
    }
  }
}

/**
 * 为指定位置的真实砖块生成周围的虚拟砖块
 */
export function generateBoundaryForBlock(blockX, blockY, blockZ, getBlock, setBlock) {
  const neighbors = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]

  for (const [dx, dy, dz] of neighbors) {
    const nx = blockX + dx
    const ny = blockY + dy
    const nz = blockZ + dz

    const neighborType = getBlock(nx, ny, nz)
    if (neighborType && neighborType !== BOUNDARY_TYPE) continue
    if (getBlock(nx, ny, nz) === BOUNDARY_TYPE) continue

    const boundaryY = ny - 1
    if (boundaryY >= 0) {
      if (!getBlock(nx, boundaryY, nz)) {
        setBlock(nx, boundaryY, nz, BOUNDARY_TYPE)
      }
    }
  }
}
