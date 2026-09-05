import { onBeforeUnmount, ref } from "vue";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

const WORLD_SIZE = 32; // 世界边长（方块数）
const WORLD_HEIGHT = 24; // 世界高度（方块数）
const BOUNDARY_TYPE = 7; // 边界辅助方块类型

// 方块类型表：id -> 名称、颜色、特性
// solid: 是否实心（false 表示可穿过，如火焰）
// transparent: 是否透明（玻璃）
// emissive: 是否自发光（火焰）
const BLOCK_TYPES = {
  1: {
    name: "草坪",
    base: "#7cb342",
    dark: "#558b2f",
    solid: true,
    transparent: false,
    emissive: false,
  },
  2: {
    name: "泥土",
    base: "#8d6e63",
    dark: "#6d4c41",
    solid: true,
    transparent: false,
    emissive: false,
  },
  3: {
    name: "石头",
    base: "#9e9e9e",
    dark: "#757575",
    solid: true,
    transparent: false,
    emissive: false,
  },
  4: {
    name: "铁块",
    base: "#b0bec5",
    dark: "#78909c",
    solid: true,
    transparent: false,
    emissive: false,
  },
  5: {
    name: "玻璃",
    base: "#c8e6ff",
    dark: "#e3f2fd",
    solid: true,
    transparent: true,
    emissive: false,
  },
  6: {
    name: "火焰",
    base: "#ff9800",
    dark: "#f57c00",
    solid: false,
    transparent: true,
    emissive: true,
  },
  7: {
    name: "边界",
    base: "#000000",
    dark: "#000000",
    solid: false,
    transparent: true,
    emissive: false,
    boundary: true,
  },
};

// 可在 HUD 中切换的方块（按数字键 1-6 选择，不包含边界辅助方块 7）
const SELECTABLE_TYPES = [1, 4, 5, 2, 3, 6];

// 滚轮切换节流时间（毫秒）
const WHEEL_THROTTLE_MS = 150;

/**
 * 我的世界风格体素沙盒：
 * - 简单噪声地形生成
 * - 第一人称移动（WASD + 空格跳跃 + Shift 下蹲）
 * - 左键破坏方块 / 右键放置方块
 * - 准星瞄准的方块高亮
 */
export function useMinecraft(canvas) {
  const isLocked = ref(false);
  // canvas 可能以 ref 形式传入；在 init 时再解包，确保拿到已挂载的 DOM 元素
  let canvasEl = null;

  let renderer, scene, camera, controls;
  let rafId = 0;
  let disposed = false;

  // 方块体素数据：`x,y,z` 键 -> 方块类型。只存实心方块，未命中即空气。
  const voxels = new Map();
  const blockMeshes = new THREE.Group();

  // 玩家状态
  const player = {
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    onGround: false,
    yaw: 0,
    pitch: 0,
  };
  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  };

  const keyToBlock = (x, y, z) => `${x},${y},${z}`;

  const getBlock = (x, y, z) => voxels.get(keyToBlock(x, y, z));

  const setBlock = (x, y, z, type) => {
    const key = keyToBlock(x, y, z);
    if (type === 0 || type == null) {
      voxels.delete(key);
    } else {
      voxels.set(key, type);
    }
  };

  // ---------- 地形生成：一个起伏的草地平原，地表草块、下方泥土、再往下石头 ----------
  function generateTerrain() {
    voxels.clear();
    for (let x = 0; x < WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        // 用距离中心点的衰减 + 正弦叠加做柔和起伏
        const cx = x - WORLD_SIZE / 2;
        const cz = z - WORLD_SIZE / 2;
        const dist = Math.sqrt(cx * cx + cz * cz);
        const height =
          Math.floor(
            WORLD_HEIGHT / 2 +
              Math.sin(x * 0.35) * 2 +
              Math.cos(z * 0.3) * 2 +
              Math.sin((x + z) * 0.15) * 2.5 -
              Math.max(0, dist - 12) * 0.6,
          ) + 1;
        for (let y = 0; y <= height; y++) {
          let type;
          if (y === height)
            type = 1; // 草
          else if (y >= height - 3)
            type = 2; // 泥土
          else type = 3; // 石头
          setBlock(x, y, z, type);
        }
      }
    }
    // 生成边界辅助方块：在世界最外层（x=0, x=WORLD_SIZE-1, z=0, z=WORLD_SIZE-1）
    generateBoundaryBlocks();
  }

  function generateBoundaryBlocks() {
    // 只在最外侧真实砖块的四周且周围没有真实砖块的位置放置虚拟砖块
    // 虚拟砖块高度比真实砖块低一个砖块（y-1）
    const boundaryPositions = new Set();

    // 遍历所有真实砖块
    for (const [key, type] of voxels.entries()) {
      // 跳过边界方块（type 7）
      if (type === BOUNDARY_TYPE) continue;

      const [x, y, z] = key.split(",").map(Number);

      // 检查四个水平方向（上、下、左、右）
      const neighbors = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 0, 1],
        [0, 0, -1],
      ];

      for (const [dx, dy, dz] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;

        // 检查该位置是否有真实砖块（排除边界方块）
        const neighborType = getBlock(nx, ny, nz);
        if (neighborType && neighborType !== BOUNDARY_TYPE) continue;

        // 检查该位置是否已有边界方块
        if (getBlock(nx, ny, nz) === BOUNDARY_TYPE) continue;

        // 在该位置放置虚拟砖块，但高度降低一个砖块（y-1）
        // 这样虚拟砖块在真实砖块的下方，玩家站在真实砖块上时能选中虚拟砖块的外侧面
        const boundaryY = ny - 1;
        // 确保边界方块不低于地面（最小 y=0）
        if (boundaryY >= 0) {
          boundaryPositions.add(`${nx},${boundaryY},${nz}`);
        }
      }
    }

    // 将虚拟砖块添加到 voxels
    for (const key of boundaryPositions) {
      const [x, y, z] = key.split(",").map(Number);
      // 检查该位置是否已有任何方块（避免覆盖真实砖块）
      if (!getBlock(x, y, z)) {
        setBlock(x, y, z, BOUNDARY_TYPE);
      }
    }
  }

  // ---------- 用 InstancedMesh 高效渲染所有方块 ----------
  function buildMesh() {
    blockMeshes.clear();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // 用 TextureLoader 加载 local 网络图片贴图
    const loader = new THREE.TextureLoader();
    const materials = {};
    for (const [typeStr, info] of Object.entries(BLOCK_TYPES)) {
      const type = Number(typeStr);
      const isBoundary = type === BOUNDARY_TYPE;
      // 边界辅助方块：完全透明，不使用纹理
      if (isBoundary) {
        materials[type] = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity: 0,
          color: 0x000000,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        continue;
      }
      const tex = loader.load(TEXTURE_PATHS[type]);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      materials[type] = new THREE.MeshLambertMaterial({
        map: tex,
        transparent: info.transparent,
        opacity: info.transparent ? 0.55 : 1,
        emissive: info.emissive ? new THREE.Color("#ff6d00") : undefined,
        emissiveIntensity: info.emissive ? 1.2 : 1,
      });
    }

    // 按类型分组创建 InstancedMesh
    const byType = new Map();
    for (const [key, type] of voxels.entries()) {
      if (!byType.has(type)) byType.set(type, []);
      byType.get(type).push(key.split(",").map(Number));
    }

    for (const [type, positions] of byType.entries()) {
      if (!materials[type]) continue;
      const mesh = new THREE.InstancedMesh(
        geometry,
        materials[type],
        positions.length,
      );
      const matrix = new THREE.Matrix4();
      positions.forEach(([x, y, z], i) => {
        matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      blockMeshes.add(mesh);
    }
    scene.add(blockMeshes);
  }

  // 方块贴图路径：本地 public/textures 下的网络图片
  const TEXTURE_PATHS = {
    1: "/textures/grass.png", // 草顶
    2: "/textures/dirt.png", // 泥土
    3: "/textures/stone.jpg", // 石头
    4: "/textures/iron.jpg", // 铁块
    5: "/textures/glass.jpg", // 玻璃
    6: "/textures/flame.jpg", // 火焰
    7: "/textures/grass.png", // 边界辅助方块（透明纹理，实际不可见）
  };

  // ---------- 射线检测：返回命中的方块与命中面法线 ----------
  function raycastBlock(maxDist = 15) {
    const origin = camera.position.clone();
    const dir = camera.getWorldDirection(new THREE.Vector3());

    // 用 DDA 体素遍历算法，在 3D 网格上逐格推进
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : -1;
    const stepY = dir.y > 0 ? 1 : -1;
    const stepZ = dir.z > 0 ? 1 : -1;

    const tDeltaX = Math.abs(1 / dir.x);
    const tDeltaY = Math.abs(1 / dir.y);
    const tDeltaZ = Math.abs(1 / dir.z);

    let tMaxX =
      dir.x !== 0
        ? (stepX > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX
        : Infinity;
    let tMaxY =
      dir.y !== 0
        ? (stepY > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY
        : Infinity;
    let tMaxZ =
      dir.z !== 0
        ? (stepZ > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ
        : Infinity;

    let normal = null;
    let t = 0;

    while (t <= maxDist) {
      if (getBlock(x, y, z)) {
        return { x, y, z, normal: normal || new THREE.Vector3(0, -1, 0) };
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        t = tMaxX;
        tMaxX += tDeltaX;
        normal = new THREE.Vector3(-stepX, 0, 0);
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        t = tMaxY;
        tMaxY += tDeltaY;
        normal = new THREE.Vector3(0, -stepY, 0);
      } else {
        z += stepZ;
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        normal = new THREE.Vector3(0, 0, -stepZ);
      }
    }
    return null;
  }

  // 准星瞄准的方块高亮：只显示命中的那个面（蓝色边框 + 半透明蓝色填充）
  const faceGroup = new THREE.Group();
  faceGroup.visible = false;

  const faceNames = ["right", "left", "top", "bottom", "front", "back"];
  const facePositions = {
    right: [0.5, 0, 0],
    left: [-0.5, 0, 0],
    top: [0, 0.5, 0],
    bottom: [0, -0.5, 0],
    front: [0, 0, 0.5],
    back: [0, 0, -0.5],
  };
  const faceRotations = {
    right: [0, Math.PI / 2, 0],
    left: [0, -Math.PI / 2, 0],
    top: [-Math.PI / 2, 0, 0],
    bottom: [Math.PI / 2, 0, 0],
    front: [0, 0, 0],
    back: [0, Math.PI, 0],
  };

  // 法线方向到面名称的映射
  const normalToFace = {
    "1,0,0": "right",
    "-1,0,0": "left",
    "0,1,0": "top",
    "0,-1,0": "bottom",
    "0,0,1": "front",
    "0,0,-1": "back",
  };

  const faceMeshes = {};
  faceNames.forEach((name) => {
    const geo = new THREE.PlaneGeometry(1.01, 1.01);

    // 边框线
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
    });
    const line = new THREE.LineSegments(edges, lineMat);
    line.renderOrder = 999;

    // 填充面
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.2,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const fill = new THREE.Mesh(geo.clone(), fillMat);
    fill.renderOrder = 998;

    const group = new THREE.Group();
    group.add(line);
    group.add(fill);

    group.position.set(
      facePositions[name][0],
      facePositions[name][1],
      facePositions[name][2],
    );
    group.rotation.set(
      faceRotations[name][0],
      faceRotations[name][1],
      faceRotations[name][2],
    );

    faceGroup.add(group);
    faceMeshes[name] = group;
  });

  // 当前高亮的面
  let currentHighlightFace = null;

  // 已选中的方块类型（默认草块）；用 ref 以便 HUD 响应式显示
  const selectedType = ref(1);

  // 滚轮切换节流相关
  let lastWheelTime = 0;

  // 按数字键切换选中方块
  function selectType(index) {
    if (index >= 0 && index < SELECTABLE_TYPES.length) {
      selectedType.value = SELECTABLE_TYPES[index];
    }
  }

  // 滚轮切换方块（带节流）
  function onWheel(e) {
    if (!isLocked.value) return;
    e.preventDefault();

    const now = performance.now();
    if (now - lastWheelTime < WHEEL_THROTTLE_MS) return;
    lastWheelTime = now;

    const currentIndex = SELECTABLE_TYPES.indexOf(selectedType.value);
    if (currentIndex === -1) return;

    let newIndex = currentIndex;
    if (e.deltaY > 0) {
      // 向下滚动：下一个
      newIndex = (currentIndex + 1) % SELECTABLE_TYPES.length;
    } else if (e.deltaY < 0) {
      // 向上滚动：上一个
      newIndex =
        (currentIndex - 1 + SELECTABLE_TYPES.length) % SELECTABLE_TYPES.length;
    } else {
      return;
    }
    selectType(newIndex);
  }

  function init() {
    // 此处解包 ref：onMounted 之后 canvas 元素已挂载，能取到真实 DOM
    canvasEl = canvas && canvas.value !== undefined ? canvas.value : canvas;
    if (!canvasEl) {
      console.error("[useMinecraft] canvas 元素未找到");
      return;
    }

    // 场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 70);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 相机
    camera = new THREE.PerspectiveCamera(
      75,
      canvasEl.clientWidth / canvasEl.clientHeight,
      0.1,
      200,
    );

    // 光照
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(40, 60, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    sun.shadow.camera.far = 150;
    scene.add(sun);
    scene.add(new THREE.AmbientLight(0xbfd9ff, 1.2));

    // 控制器
    controls = new PointerLockControls(camera, canvasEl);
    controls.addEventListener("lock", () => {
      isLocked.value = true;
    });
    controls.addEventListener("unlock", () => {
      isLocked.value = false;
    });

    // 生成世界
    generateTerrain();
    buildMesh();
    scene.add(faceGroup);

    // 玩家初始位置：中心点地表上方
    const spawnX = Math.floor(WORLD_SIZE / 2);
    const spawnZ = Math.floor(WORLD_SIZE / 2);
    let groundY = WORLD_HEIGHT - 1;
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (getBlock(spawnX, y, spawnZ)) {
        groundY = y + 1;
        break;
      }
    }
    player.position.set(spawnX + 0.5, groundY + 0.02, spawnZ + 0.5);
    player.velocity.set(0, 0, 0);
    player.onGround = true;
    camera.position.set(
      player.position.x,
      player.position.y + EYE_HEIGHT,
      player.position.z,
    );

    // 事件绑定
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onResize);

    animate();
  }

  function onKeyDown(e) {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        keys.forward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        keys.back = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        keys.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        keys.right = true;
        break;
      case "Space":
        keys.jump = true;
        e.preventDefault();
        break;
      case "ShiftLeft":
      case "ShiftRight":
        keys.sprint = true;
        break;
      case "KeyR":
        // 重生：传回地表
        resetToSpawn();
        break;
      case "Digit1":
      case "Numpad1":
        selectType(0);
        break;
      case "Digit2":
      case "Numpad2":
        selectType(1);
        break;
      case "Digit3":
      case "Numpad3":
        selectType(2);
        break;
      case "Digit4":
      case "Numpad4":
        selectType(3);
        break;
      case "Digit5":
      case "Numpad5":
        selectType(4);
        break;
      case "Digit6":
      case "Numpad6":
        selectType(5);
        break;
    }
  }

  function onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        keys.forward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        keys.back = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        keys.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        keys.right = false;
        break;
      case "Space":
        keys.jump = false;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        keys.sprint = false;
        break;
    }
  }

  function onMouseDown(e) {
    if (!isLocked.value) return;
    const hit = raycastBlock();
    if (!hit) return;

    if (e.button === 0) {
      // 左键：破坏方块
      removeBlockAt(hit);
    } else if (e.button === 2) {
      // 右键：放置方块
      placeBlockAt(hit);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  function removeBlockAt(hit) {
    const type = getBlock(hit.x, hit.y, hit.z);
    // 禁止删除边界辅助方块
    if (type === BOUNDARY_TYPE) return;
    setBlock(hit.x, hit.y, hit.z, 0);
    buildMesh();
  }

  // 为指定位置的真实砖块生成周围的虚拟砖块
  function generateBoundaryForBlock(blockX, blockY, blockZ) {
    const neighbors = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    for (const [dx, dy, dz] of neighbors) {
      const nx = blockX + dx;
      const ny = blockY + dy;
      const nz = blockZ + dz;

      // 检查该位置是否有真实砖块
      const neighborType = getBlock(nx, ny, nz);
      if (neighborType && neighborType !== BOUNDARY_TYPE) continue;

      // 检查该位置是否已有边界方块
      if (getBlock(nx, ny, nz) === BOUNDARY_TYPE) continue;

      // 虚拟砖块高度降低一个砖块
      const boundaryY = ny - 1;
      if (boundaryY >= 0) {
        // 检查该位置是否已有任何方块
        if (!getBlock(nx, boundaryY, nz)) {
          setBlock(nx, boundaryY, nz, BOUNDARY_TYPE);
        }
      }
    }
  }

  function placeBlockAt(hit) {
    const nx = hit.x + hit.normal.x;
    const ny = hit.y + hit.normal.y;
    const nz = hit.z + hit.normal.z;

    // 检查目标位置是否已有方块（不能重复放置）
    if (getBlock(nx, ny, nz)) return;

    // 如果命中边界辅助方块，允许在外侧放置（nx, ny, nz 在虚空也可以）
    // 但需要检查是否在世界范围内（允许稍微超出边界 1 格）
    const hitType = getBlock(hit.x, hit.y, hit.z);
    const isBoundaryHit = hitType === BOUNDARY_TYPE;

    // 完全移除边界限制，允许玩家在任意位置放置方块（包括负数）
    // 只需要检查目标位置是否已被占用（已在前面检查）
    // 以及不与玩家碰撞（后面检查）

    // 不允许把方块放进玩家身体：新方块若与玩家包围盒重叠则拒绝
    // 但如果是在边界外侧扩建，允许方块与玩家重叠（因为玩家站在边界外侧，新方块可能紧贴玩家）
    setBlock(nx, ny, nz, selectedType.value);
    if (!isBoundaryHit) {
      // 只有非边界命中时，才检查玩家碰撞
      if (collidesAt(player.position.x, player.position.y, player.position.z)) {
        setBlock(nx, ny, nz, 0);
        return;
      }
    }

    // 为新放置的真实砖块生成周围的虚拟砖块
    generateBoundaryForBlock(nx, ny, nz);

    buildMesh();
  }

  function resetToSpawn() {
    const spawnX = Math.floor(WORLD_SIZE / 2);
    const spawnZ = Math.floor(WORLD_SIZE / 2);
    let groundY = WORLD_HEIGHT - 1;
    for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
      if (getBlock(spawnX, y, spawnZ)) {
        groundY = y + 1;
        break;
      }
    }
    player.position.set(spawnX + 0.5, groundY + 0.02, spawnZ + 0.5);
    player.velocity.set(0, 0, 0);
    player.onGround = true;
    camera.position.set(
      player.position.x,
      player.position.y + EYE_HEIGHT,
      player.position.z,
    );
  }

  function onResize() {
    if (!canvasEl) return;
    camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight, false);
  }

  // ---------- 物理与移动 ----------
  const GRAVITY = -24;
  const WALK_SPEED = 5;
  const SPRINT_SPEED = 8.5;
  const JUMP_SPEED = 8.5;
  const EYE_HEIGHT = 1.62;
  const PLAYER_HEIGHT = 1.8; // 玩家碰撞盒高度
  const PLAYER_HALF = 0.3; // 玩家碰撞盒半宽（x/z 方向）

  function isSolid(x, y, z) {
    const type = getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    if (!type) return false;
    // 边界辅助方块不可碰撞
    if (type === BOUNDARY_TYPE) return false;
    return BLOCK_TYPES[type] ? BLOCK_TYPES[type].solid : true;
  }

  function updatePlayer(dt) {
    if (!isLocked.value) return;

    // 朝向
    player.yaw = controls.getAzimuthalAngle ? camera.rotation.y : player.yaw;
    player.pitch = camera.rotation.x;

    // 用相机真实朝向作为前方向量（可靠，不依赖手工三角函数符号约定）
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(
      forward,
      new THREE.Vector3(0, 1, 0),
    );

    const move = new THREE.Vector3();
    if (keys.forward) move.add(forward); // W 键：朝相机前方移动
    if (keys.back) move.sub(forward); // S 键：朝相机后方移动
    if (keys.left) move.sub(right);
    if (keys.right) move.add(right);
    if (move.lengthSq() > 0) move.normalize();

    const speed = keys.sprint ? SPRINT_SPEED : WALK_SPEED;
    const velocityXZ = move.multiplyScalar(speed);
    player.velocity.x = velocityXZ.x;
    player.velocity.z = velocityXZ.z;

    // 跳跃
    if (keys.jump && player.onGround) {
      player.velocity.y = JUMP_SPEED;
      player.onGround = false;
    }

    // 重力
    player.velocity.y += GRAVITY * dt;
    // 限制最大下落速度，防止低帧率下单帧穿透方块
    const MAX_FALL = 18;
    if (player.velocity.y < -MAX_FALL) player.velocity.y = -MAX_FALL;

    // 逐轴移动并做碰撞检测（先水平，再竖直）
    stepMoveXZ(dt);
    // y 轴用子步进，确保不穿透薄方块
    stepMoveY(dt);

    camera.position.set(
      player.position.x,
      player.position.y + EYE_HEIGHT,
      player.position.z,
    );
  }

  // y 轴子步进移动：把单帧竖直位移拆成小块，避免高速穿透方块
  function stepMoveY(dt) {
    const totalDy = player.velocity.y * dt;
    const step = 0.2; // 每步最多移动 0.2 格
    const steps = Math.max(1, Math.ceil(Math.abs(totalDy) / step));
    const dyPerStep = totalDy / steps;

    for (let i = 0; i < steps; i++) {
      player.position.y += dyPerStep;
      // 用包围盒检测，撞到则吸附并停止
      if (collidesAt(player.position.x, player.position.y, player.position.z)) {
        if (player.velocity.y < 0) {
          // 向下撞到地面：脚贴回方块顶面
          player.position.y = Math.floor(player.position.y) + 1 + 0.001;
          player.onGround = true;
        } else if (player.velocity.y > 0) {
          // 向上撞到天花板：头顶贴回方块底面
          player.position.y = Math.floor(player.position.y) - 0.001;
        }
        player.velocity.y = 0;
        return;
      }
    }
    // 没有撞到，说明在空中
    if (player.velocity.y < 0) {
      player.onGround = false;
    }
  }

  // 玩家 AABB 包围盒是否与某个实心方块重叠
  function collidesAt(px, py, pz) {
    const minX = Math.floor(px - PLAYER_HALF);
    const maxX = Math.floor(px + PLAYER_HALF);
    const minY = Math.floor(py);
    const maxY = Math.floor(py + PLAYER_HEIGHT);
    const minZ = Math.floor(pz - PLAYER_HALF);
    const maxZ = Math.floor(pz + PLAYER_HALF);
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (isSolid(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  // x/z 轴子步进移动：用包围盒逐轴检测，撞墙则吸附到方块边界
  function stepMoveXZ(dt) {
    const step = 0.2;

    // X 轴
    const dx = player.velocity.x * dt;
    const stepsX = Math.max(1, Math.ceil(Math.abs(dx) / step));
    const dxPerStep = dx / stepsX;
    for (let i = 0; i < stepsX; i++) {
      player.position.x += dxPerStep;
      if (collidesAt(player.position.x, player.position.y, player.position.z)) {
        // 撞墙：吸附回方块边界
        if (dxPerStep > 0) {
          player.position.x =
            Math.floor(player.position.x + PLAYER_HALF) - PLAYER_HALF - 0.001;
        } else if (dxPerStep < 0) {
          player.position.x =
            Math.floor(player.position.x - PLAYER_HALF) +
            1 +
            PLAYER_HALF +
            0.001;
        }
        player.velocity.x = 0;
        break;
      }
    }

    // Z 轴
    const dz = player.velocity.z * dt;
    const stepsZ = Math.max(1, Math.ceil(Math.abs(dz) / step));
    const dzPerStep = dz / stepsZ;
    for (let i = 0; i < stepsZ; i++) {
      player.position.z += dzPerStep;
      if (collidesAt(player.position.x, player.position.y, player.position.z)) {
        if (dzPerStep > 0) {
          player.position.z =
            Math.floor(player.position.z + PLAYER_HALF) - PLAYER_HALF - 0.001;
        } else if (dzPerStep < 0) {
          player.position.z =
            Math.floor(player.position.z - PLAYER_HALF) +
            1 +
            PLAYER_HALF +
            0.001;
        }
        player.velocity.z = 0;
        break;
      }
    }
  }

  // ---------- 渲染循环 ----------
  let lastTime = performance.now();

  function animate() {
    if (disposed) return;
    rafId = requestAnimationFrame(animate);

    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    updatePlayer(dt);
    updateHighlight();

    renderer.render(scene, camera);
  }

  function updateHighlight() {
    if (!isLocked.value) {
      faceGroup.visible = false;
      return;
    }
    const hit = raycastBlock();
    if (hit) {
      // 根据法线确定要显示哪个面
      const normalKey = `${Math.round(hit.normal.x)},${Math.round(hit.normal.y)},${Math.round(hit.normal.z)}`;
      const faceName = normalToFace[normalKey];

      // 隐藏所有面
      faceNames.forEach((name) => {
        faceMeshes[name].visible = false;
      });

      // 显示命中的面
      if (faceName && faceMeshes[faceName]) {
        faceMeshes[faceName].visible = true;
        // 将面组移动到方块位置
        faceGroup.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        faceGroup.visible = true;
      } else {
        faceGroup.visible = false;
      }
    } else {
      faceGroup.visible = false;
    }
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("wheel", onWheel);
    window.removeEventListener("resize", onResize);
    if (controls) controls.dispose();
    // 清理面高亮资源
    faceGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    blockMeshes.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const m = obj.material;
        if (m.map) m.map.dispose();
        m.dispose();
      }
    });
    if (renderer) renderer.dispose();
  }

  onBeforeUnmount(dispose);

  return {
    isLocked,
    selectedType,
    selectableTypes: SELECTABLE_TYPES,
    blockTypes: BLOCK_TYPES,
    texturePaths: TEXTURE_PATHS,
    init,
    dispose,
    lock: () => controls && controls.lock(),
    unlock: () => controls && controls.unlock(),
  };
}
