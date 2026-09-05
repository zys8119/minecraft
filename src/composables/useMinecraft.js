import { onBeforeUnmount, ref } from "vue";
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

import {
  BLOCK_TYPES,
  SELECTABLE_TYPES,
  TEXTURE_PATHS,
  BOUNDARY_TYPE,
} from "./blockTypes.js";
import { StorageAdapter, STORAGE_KEY } from "./storage.js";
import {
  WORLD_SIZE,
  WORLD_HEIGHT,
  generateTerrain,
  generateBoundaryBlocks,
  generateBoundaryForBlock,
} from "./worldGenerator.js";
import {
  GRAVITY,
  WALK_SPEED,
  SPRINT_SPEED,
  JUMP_SPEED,
  EYE_HEIGHT,
  PLAYER_HEIGHT,
  PLAYER_HALF,
  stepMoveXZ,
  stepMoveY,
  isSolid,
  collidesAt,
} from "./physics.js";
import {
  raycastBlock,
  FACE_NAMES,
  FACE_POSITIONS,
  FACE_ROTATIONS,
  NORMAL_TO_FACE,
} from "./raycaster.js";

const WHEEL_THROTTLE_MS = 150;
const storageAdapter = new StorageAdapter();

/**
 * 我的世界风格体素沙盒主组合式函数
 */
export function useMinecraft(canvas) {
  const isLocked = ref(false);
  let canvasEl = null;
  let renderer, scene, camera, controls;
  let rafId = 0;
  let disposed = false;

  // 方块体素数据
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

  // ---------- 工具函数 ----------
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

  // 封装的生成函数（注入依赖）
  const _generateTerrain = () => generateTerrain(voxels, getBlock, setBlock);
  const _generateBoundaryBlocks = () =>
    generateBoundaryBlocks(voxels, getBlock, setBlock);
  const _generateBoundaryForBlock = (x, y, z) =>
    generateBoundaryForBlock(x, y, z, getBlock, setBlock);

  // 封装的物理函数（注入依赖）
  const _isSolid = (x, y, z) => isSolid(x, y, z, getBlock);
  const _collidesAt = (px, py, pz) => collidesAt(px, py, pz, getBlock);
  const _stepMoveXZ = (dt) => stepMoveXZ(player, dt, getBlock);
  const _stepMoveY = (dt) => stepMoveY(player, dt, getBlock);

  // ---------- 构建网格 ----------
  function buildMesh() {
    blockMeshes.clear();

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const loader = new THREE.TextureLoader();
    const materials = {};

    for (const [typeStr, info] of Object.entries(BLOCK_TYPES)) {
      const type = Number(typeStr);
      const isBoundary = type === BOUNDARY_TYPE;

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

  // ---------- 高亮面 ----------
  const faceGroup = new THREE.Group();
  faceGroup.visible = false;

  const faceMeshes = {};
  FACE_NAMES.forEach((name) => {
    const geo = new THREE.PlaneGeometry(1.01, 1.01);
    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 1.0,
      depthTest: false,
    });
    const line = new THREE.LineSegments(edges, lineMat);
    line.renderOrder = 999;

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
      FACE_POSITIONS[name][0],
      FACE_POSITIONS[name][1],
      FACE_POSITIONS[name][2],
    );
    group.rotation.set(
      FACE_ROTATIONS[name][0],
      FACE_ROTATIONS[name][1],
      FACE_ROTATIONS[name][2],
    );
    faceGroup.add(group);
    faceMeshes[name] = group;
  });

  // ---------- 选中方块 ----------
  const selectedType = ref(1);
  let lastWheelTime = 0;

  function selectType(index) {
    if (index >= 0 && index < SELECTABLE_TYPES.length) {
      selectedType.value = SELECTABLE_TYPES[index];
    }
  }

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
      newIndex = (currentIndex + 1) % SELECTABLE_TYPES.length;
    } else if (e.deltaY < 0) {
      newIndex =
        (currentIndex - 1 + SELECTABLE_TYPES.length) % SELECTABLE_TYPES.length;
    } else {
      return;
    }
    selectType(newIndex);
  }

  // ---------- 游戏操作 ----------
  function removeBlockAt(hit) {
    const type = getBlock(hit.x, hit.y, hit.z);
    if (type === BOUNDARY_TYPE) return;
    setBlock(hit.x, hit.y, hit.z, 0);
    buildMesh();
  }

  function placeBlockAt(hit) {
    const nx = hit.x + hit.normal.x;
    const ny = hit.y + hit.normal.y;
    const nz = hit.z + hit.normal.z;

    if (getBlock(nx, ny, nz)) return;

    const hitType = getBlock(hit.x, hit.y, hit.z);
    const isBoundaryHit = hitType === BOUNDARY_TYPE;

    setBlock(nx, ny, nz, selectedType.value);
    if (!isBoundaryHit) {
      if (
        _collidesAt(player.position.x, player.position.y, player.position.z)
      ) {
        setBlock(nx, ny, nz, 0);
        return;
      }
    }

    _generateBoundaryForBlock(nx, ny, nz);
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

  // ---------- 存档 ----------
  async function saveWorld() {
    try {
      const data = {
        voxels: Array.from(voxels.entries()),
        player: {
          x: player.position.x,
          y: player.position.y,
          z: player.position.z,
          yaw: player.yaw,
          pitch: player.pitch,
        },
        selectedType: selectedType.value,
        timestamp: Date.now(),
        storageType: storageAdapter.getType(),
      };
      await storageAdapter.save(STORAGE_KEY, data);
      console.log(
        `[存档] 已保存到 ${storageAdapter.getType()}, 共 ${data.voxels.length} 个方块`,
      );
      return true;
    } catch (e) {
      console.error("[存档] 保存失败:", e);
      return false;
    }
  }

  async function loadWorld() {
    try {
      const data = await storageAdapter.load(STORAGE_KEY);
      if (!data) {
        console.log("[读档] 没有找到存档数据");
        return false;
      }

      voxels.clear();
      for (const [key, type] of data.voxels) {
        voxels.set(key, type);
      }

      if (data.player) {
        player.position.set(data.player.x, data.player.y, data.player.z);
        player.yaw = data.player.yaw || 0;
        player.pitch = data.player.pitch || 0;
        player.velocity.set(0, 0, 0);
        player.onGround = true;
        camera.position.set(
          player.position.x,
          player.position.y + EYE_HEIGHT,
          player.position.z,
        );
      }

      if (data.selectedType) {
        selectedType.value = data.selectedType;
      }

      buildMesh();
      console.log(
        `[读档] 已从 ${data.storageType || storageAdapter.getType()} 加载，共 ${data.voxels.length} 个方块`,
      );
      return true;
    } catch (e) {
      console.error("[读档] 加载失败:", e);
      return false;
    }
  }

  async function clearSave() {
    try {
      await storageAdapter.clear(STORAGE_KEY);
      console.log("[清除存档] 已清除");
      return true;
    } catch (e) {
      console.error("[清除存档] 失败:", e);
      return false;
    }
  }

  async function resetWorld() {
    try {
      await storageAdapter.clear(STORAGE_KEY);
      voxels.clear();
      _generateTerrain();
      buildMesh();
      resetToSpawn();
      console.log("[重置世界] 已重置为默认地形");
      return true;
    } catch (e) {
      console.error("[重置世界] 失败:", e);
      return false;
    }
  }

  // ---------- 自动存档 ----------
  let autoSaveInterval = null;
  function startAutoSave(intervalMs = 30000) {
    stopAutoSave();
    autoSaveInterval = setInterval(() => {
      if (isLocked.value) {
        saveWorld();
      }
    }, intervalMs);
  }

  function stopAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  // ---------- 更新玩家 ----------
  function updatePlayer(dt) {
    if (!isLocked.value) return;

    player.yaw = controls.getAzimuthalAngle ? camera.rotation.y : player.yaw;
    player.pitch = camera.rotation.x;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(
      forward,
      new THREE.Vector3(0, 1, 0),
    );

    const move = new THREE.Vector3();
    if (keys.forward) move.add(forward);
    if (keys.back) move.sub(forward);
    if (keys.left) move.sub(right);
    if (keys.right) move.add(right);
    if (move.lengthSq() > 0) move.normalize();

    const speed = keys.sprint ? SPRINT_SPEED : WALK_SPEED;
    const velocityXZ = move.multiplyScalar(speed);
    player.velocity.x = velocityXZ.x;
    player.velocity.z = velocityXZ.z;

    if (keys.jump && player.onGround) {
      player.velocity.y = JUMP_SPEED;
      player.onGround = false;
    }

    player.velocity.y += GRAVITY * dt;
    const MAX_FALL = 18;
    if (player.velocity.y < -MAX_FALL) player.velocity.y = -MAX_FALL;

    _stepMoveXZ(dt);
    _stepMoveY(dt);

    camera.position.set(
      player.position.x,
      player.position.y + EYE_HEIGHT,
      player.position.z,
    );
  }

  // ---------- 高亮更新 ----------
  function updateHighlight() {
    if (!isLocked.value) {
      faceGroup.visible = false;
      return;
    }
    const hit = raycastBlock(camera, getBlock);
    if (hit) {
      const normalKey = `${Math.round(hit.normal.x)},${Math.round(hit.normal.y)},${Math.round(hit.normal.z)}`;
      const faceName = NORMAL_TO_FACE[normalKey];

      FACE_NAMES.forEach((name) => {
        faceMeshes[name].visible = false;
      });

      if (faceName && faceMeshes[faceName]) {
        faceMeshes[faceName].visible = true;
        faceGroup.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
        faceGroup.visible = true;
      } else {
        faceGroup.visible = false;
      }
    } else {
      faceGroup.visible = false;
    }
  }

  // ---------- 事件处理 ----------
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
    const hit = raycastBlock(camera, getBlock);
    if (!hit) return;

    if (e.button === 0) {
      removeBlockAt(hit);
    } else if (e.button === 2) {
      placeBlockAt(hit);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  function onResize() {
    if (!canvasEl) return;
    camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight, false);
  }

  // ---------- 全屏控制 ----------
  function toggleFullscreen() {
    const el = canvasEl || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) => {
        console.warn("[全屏] 进入全屏失败:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("[全屏] 退出全屏失败:", err);
      });
    }
  }

  function onFullscreenChange() {
    if (!document.fullscreenElement && isLocked.value) {
      setTimeout(() => {
        if (controls && !controls.isLocked) {
          controls.lock();
        }
      }, 100);
    }
  }

  function isFullscreen() {
    return !!document.fullscreenElement;
  }

  // ---------- 初始化 ----------
  function init() {
    canvasEl = canvas && canvas.value !== undefined ? canvas.value : canvas;
    if (!canvasEl) {
      console.error("[useMinecraft] canvas 元素未找到");
      return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 70);

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasEl.clientWidth, canvasEl.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    camera = new THREE.PerspectiveCamera(
      75,
      canvasEl.clientWidth / canvasEl.clientHeight,
      0.1,
      200,
    );

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

    controls = new PointerLockControls(camera, canvasEl);
    controls.addEventListener("lock", () => {
      isLocked.value = true;
    });
    controls.addEventListener("unlock", () => {
      isLocked.value = false;
    });

    _generateTerrain();
    buildMesh();
    scene.add(faceGroup);

    loadWorld().then((loaded) => {
      if (loaded) {
        console.log("[存档] 自动读档成功");
        buildMesh();
        _generateBoundaryBlocks();
        buildMesh();
        camera.position.set(
          player.position.x,
          player.position.y + EYE_HEIGHT,
          player.position.z,
        );
      } else {
        console.log("[存档] 没有存档，使用默认世界");
        resetToSpawn();
      }
    });

    startAutoSave(30000);

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("resize", onResize);

    animate();
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

  // ---------- 销毁 ----------
  function dispose() {
    disposed = true;
    stopAutoSave();
    cancelAnimationFrame(rafId);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("wheel", onWheel);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    window.removeEventListener("resize", onResize);
    if (controls) controls.dispose();

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
    saveWorld,
    loadWorld,
    clearSave,
    resetWorld,
    startAutoSave,
    stopAutoSave,
    getStorageType: () => storageAdapter.getType(),
    toggleFullscreen,
    isFullscreen,
  };
}
