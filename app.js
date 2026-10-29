import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { audio } from './audioEngine.js';

// DOM Elements
const canvas = document.querySelector('#webgl-canvas');
const stageWrap = document.querySelector('#stage-wrap');
const loadingOverlay = document.querySelector('#loading-overlay');
const loadingText = document.querySelector('#loading-text');
const loadingProgressBar = document.querySelector('#loading-progress-bar');
const animSelect = document.querySelector('#anim-select');
const btnPlayPause = document.querySelector('#btn-play-pause');
const btnResetPose = document.querySelector('#btn-reset-pose');
const rangeSpeed = document.querySelector('#range-speed');
const outputSpeed = document.querySelector('#output-speed');
const rangeStep = document.querySelector('#range-step');
const outputStep = document.querySelector('#output-step');
const btnResetPos = document.querySelector('#btn-reset-pos');
const rangeDuration = document.querySelector('#range-duration');
const outputDuration = document.querySelector('#output-duration');
const btnExportGif = document.querySelector('#btn-export-gif');
const btnExportPng = document.querySelector('#btn-export-png');
const statusText = document.querySelector('#status-text');
const activeAnimLabel = document.querySelector('#active-anim-label');
const toggleBg = document.querySelector('#toggle-bg');
const toggleFloor = document.querySelector('#toggle-floor');
const toggleShadows = document.querySelector('#toggle-shadows');
const toggleNeon = document.querySelector('#toggle-neon');

// Audio DOM Elements
const btnTopAudio = document.querySelector('#btn-top-audio');
const topSoundWave = document.querySelector('#top-sound-wave');
const btnTopMute = document.querySelector('#btn-top-mute');
const btnMusicToggle = document.querySelector('#btn-music-toggle');
const musicPlayIcon = document.querySelector('#music-play-icon');
const musicBtnText = document.querySelector('#music-btn-text');
const btnMuteToggle = document.querySelector('#btn-mute-toggle');
const trackSelect = document.querySelector('#track-select');
const customAudioInput = document.querySelector('#custom-audio-input');
const rangeMusicVol = document.querySelector('#range-music-vol');
const outputMusicVol = document.querySelector('#output-music-vol');
const rangeSfxVol = document.querySelector('#range-sfx-vol');
const outputSfxVol = document.querySelector('#output-sfx-vol');
const toggleSfx = document.querySelector('#toggle-sfx');

// Three.js Core Variables
let renderer, scene, camera, controls, clock;
let characterModel = null;
let mixer = null;
const actions = {};
let currentAction = null;
let currentAnimName = '';
let isPlaying = true;
let animSpeed = 1.0;

// Lighting References
let sunLight, neonLight1, neonLight2, ambientLight, hemiLight;

// Floor and Backdrop Meshes
let floorGroup, floorMesh, shadowPlane, neonRing;
let bgTexture = null;

// Movement State
const mascotPos = { x: 0, y: 0, z: 0 };
let targetRotation = 0;
let isMoving = false;
let moveTimeout = null;
const activeKeys = new Set();

// Friendly names for the 18 animations
const animLabels = {
  Joyful_Dance_with_Hand_Sway: '🕺 Danza Alegre (Joyful Dance)',
  Wave_One_Hand: '👋 Saludo con una Mano',
  Big_Wave_Hello: '👋 Gran Saludo (Big Wave)',
  All_Night_Dance: '🎉 Baile Toda la Noche (All Night)',
  Cherish_Pop_Dance: '💃 Danza Pop Cherish',
  Denim_Pop_Dance: '🎶 Danza Denim Pop',
  Shake_It_Off_Dance: '✨ Danza Shake It Off',
  Cheer_with_Both_Hands_1: '🙌 Celebrar con Ambas Manos',
  Walking: '🚶 Caminar (Walking)',
  Running: '🏃 Correr (Running)',
  Skip_Forward: '🦘 Salto hacia Adelante (Skip)',
  Alert: '⚠️ Modo Alerta',
  Alert_Quick_Turn_Right: '↩️ Giro Rápido en Alerta',
  Archery_Aim_with_Lateral_Scan: '🏹 Apuntar con Arco',
  Female_Crouch_Pick_Throw_Forward: '🎯 Agacharse y Lanzar',
  Grip_and_Throw_Down: '💥 Agarrar y Azotar',
  Headache_Relief: '💆 Alivio y Relajación',
  Idle_Torch_Turn_Left: '🕯️ Postura Reposo (Idle)',
};

// Initialize Scene
function initScene() {
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();

  // Camera
  const aspect = stageWrap.clientWidth / stageWrap.clientHeight;
  camera = new THREE.PerspectiveCamera(40, aspect, 0.1, 100);
  camera.position.set(0, 1.25, 3.8);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(stageWrap.clientWidth, stageWrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 0.85, 0);
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.03; // Stay above floor

  // Lights setup matching the office image
  setupLights();

  // Setup Floor & Backdrop
  setupFloorAndBackdrop();

  // Window Resize Listener
  window.addEventListener('resize', onWindowResize);

  // Animation Loop
  animate();
}

function setupLights() {
  // Ambient fill
  ambientLight = new THREE.AmbientLight(0x4a3b68, 0.8);
  scene.add(ambientLight);

  // Hemisphere light: lavender sky, deep violet floor bounce
  hemiLight = new THREE.HemisphereLight(0xd8b4fe, 0x1f1438, 0.75);
  scene.add(hemiLight);

  // Sun Light (through upper-left office windows)
  sunLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
  sunLight.position.set(-3.5, 5.5, 3.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 18;
  sunLight.shadow.camera.left = -2.5;
  sunLight.shadow.camera.right = 2.5;
  sunLight.shadow.camera.top = 3.5;
  sunLight.shadow.camera.bottom = -1.0;
  sunLight.shadow.bias = -0.0008;
  sunLight.shadow.radius = 2.5;
  scene.add(sunLight);

  // Purple Neon Light (from hanging holographic monitors on the right)
  neonLight1 = new THREE.PointLight(0xa855f7, 2.0, 12, 1.2);
  neonLight1.position.set(2.8, 3.5, 1.8);
  scene.add(neonLight1);

  // Subtle violet backlight for rim glow
  neonLight2 = new THREE.DirectionalLight(0xc084fc, 0.8);
  neonLight2.position.set(1.5, 3.0, -3.0);
  scene.add(neonLight2);
}

function setupFloorAndBackdrop() {
  floorGroup = new THREE.Group();
  scene.add(floorGroup);

  // 1. Polished Office Floor Plane
  // Sleek epoxy / reflective concrete matching the office image
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x221a36, // Deep twilight violet
    roughness: 0.28,
    metalness: 0.2,
  });
  floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.002;
  floorMesh.receiveShadow = true;
  floorGroup.add(floorMesh);

  // 2. Realistic Soft Contact Shadow Receiver (overlays on the office photo floor)
  const shadowGeo = new THREE.PlaneGeometry(14, 14);
  const shadowMat = new THREE.ShadowMaterial({
    opacity: 0.52,
  });
  shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.001;
  shadowPlane.receiveShadow = true;
  floorGroup.add(shadowPlane);

  // 3. Subtle Futuristic Hologram Ring on the floor around the mascot
  const ringGeo = new THREE.RingGeometry(0.85, 0.90, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.45,
  });
  neonRing = new THREE.Mesh(ringGeo, ringMat);
  neonRing.rotation.x = -Math.PI / 2;
  neonRing.position.y = 0.003;
  floorGroup.add(neonRing);

  // 4. Load Background Office Texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(
    'Gemini_Generated_Image_.jpeg',
    (tex) => {
      bgTexture = tex;
      bgTexture.colorSpace = THREE.SRGBColorSpace;
      scene.background = bgTexture;
      // In CSS, keep stage-wrap as fallback
      stageWrap.style.backgroundImage = 'none';
      updateStatus('Fondo de oficina Giantucchi cargado.');
    },
    undefined,
    (err) => {
      console.warn('Error loading background texture:', err);
      // Fallback CSS background
      stageWrap.style.backgroundImage = "url('Gemini_Generated_Image_.jpeg')";
      stageWrap.style.backgroundSize = 'cover';
      stageWrap.style.backgroundPosition = 'center 35%';
    }
  );
}

// Load GLTF Model (modelo.gltf)
function loadModel() {
  loadingOverlay.classList.remove('hidden');
  loadingText.textContent = 'Cargando modelo 3D (modelo.gltf)...';
  loadingProgressBar.style.width = '10%';
  updateStatus('Cargando modelo 3D...');

  const loader = new GLTFLoader();
  loader.load(
    'modelo.gltf',
    (gltf) => {
      characterModel = gltf.scene;

      // Enable shadows and optimize materials
      characterModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = Math.min(child.material.roughness ?? 0.8, 0.85);
            child.material.needsUpdate = true;
          }
        }
      });

      // Compute bounding box to ensure feet touch y = 0
      const box = new THREE.Box3().setFromObject(characterModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Model stands perfectly at ground level y = 0
      characterModel.position.set(0, -box.min.y, 0);
      mascotPos.y = -box.min.y;

      scene.add(characterModel);

      // Setup Animation Mixer
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(characterModel);

        animSelect.innerHTML = '';

        // Sort animations with Dances and Waves first
        const priority = [
          'Joyful_Dance_with_Hand_Sway',
          'Wave_One_Hand',
          'All_Night_Dance',
          'Walking',
          'Running',
          'Big_Wave_Hello',
          'Cheer_with_Both_Hands_1',
          'Cherish_Pop_Dance',
          'Denim_Pop_Dance',
          'Shake_It_Off_Dance',
        ];

        const sortedClips = [...gltf.animations].sort((a, b) => {
          const idxA = priority.indexOf(a.name);
          const idxB = priority.indexOf(b.name);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        sortedClips.forEach((clip) => {
          const action = mixer.clipAction(clip);
          actions[clip.name] = action;

          const opt = document.createElement('option');
          opt.value = clip.name;
          opt.textContent = animLabels[clip.name] || clip.name;
          animSelect.appendChild(opt);
        });

        // Set default animation
        const initialAnim = actions['Joyful_Dance_with_Hand_Sway']
          ? 'Joyful_Dance_with_Hand_Sway'
          : gltf.animations[0].name;

        animSelect.value = initialAnim;
        playAnimation(initialAnim);
      }

      // Hide loading overlay
      loadingProgressBar.style.width = '100%';
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
      }, 300);

      updateStatus(`Modelo 3D cargado (${gltf.animations?.length || 0} animaciones).`);
    },
    (xhr) => {
      if (xhr.lengthComputable && xhr.total > 0) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        loadingProgressBar.style.width = `${percent}%`;
        loadingText.textContent = `Cargando modelo 3D... ${percent}%`;
      }
    },
    (error) => {
      console.error('Error loading glTF model:', error);
      loadingText.textContent = 'Error cargando modelo.gltf. Verifica el archivo.';
      loadingProgressBar.style.backgroundColor = '#ef4444';
      updateStatus('Error al cargar modelo 3D.');
    }
  );
}

// Animation playback controller
function playAnimation(name, duration = 0.35) {
  if (!actions[name]) return;

  const prevAction = currentAction;
  const nextAction = actions[name];

  if (prevAction === nextAction) {
    if (!nextAction.isRunning()) nextAction.play();
    return;
  }

  nextAction.reset();
  nextAction.timeScale = animSpeed;
  nextAction.play();

  if (prevAction) {
    prevAction.crossFadeTo(nextAction, duration, true);
  }

  currentAction = nextAction;
  currentAnimName = name;

  const label = animLabels[name] || name;
  activeAnimLabel.textContent = `▶ ${label.split('(')[0].trim()}`;

  // Trigger unique tailored sound for each animation
  audio.playAnimationSfx(name);
}

let lastFootstepTime = 0;
function triggerFootstepAudio() {
  const now = performance.now();
  if (now - lastFootstepTime > 260) {
    audio.playSfx('step');
    lastFootstepTime = now;
  }
}

// Mascot Movement
function moveMascot(dir) {
  if (!characterModel) return;

  // Play throttled step audio
  triggerFootstepAudio();

  const stepDistance = parseFloat(rangeStep.value) || 0.25;
  let dx = 0;
  let dz = 0;

  // Directions relative to office stage
  if (dir === 'up') {
    dz = -stepDistance;
    targetRotation = Math.PI; // Face towards back/office
  } else if (dir === 'down') {
    dz = stepDistance;
    targetRotation = 0; // Face camera
  } else if (dir === 'left') {
    dx = -stepDistance;
    targetRotation = -Math.PI / 2; // Face left
  } else if (dir === 'right') {
    dx = stepDistance;
    targetRotation = Math.PI / 2; // Face right
  }

  // Calculate new position within office floor bounds
  const newX = Math.max(-2.6, Math.min(2.6, mascotPos.x + dx));
  const newZ = Math.max(-1.8, Math.min(2.2, mascotPos.z + dz));

  mascotPos.x = newX;
  mascotPos.z = newZ;

  // Update position
  characterModel.position.x = mascotPos.x;
  characterModel.position.z = mascotPos.z;

  // Update floor halo ring
  neonRing.position.x = mascotPos.x;
  neonRing.position.z = mascotPos.z;

  // Temporary transition to walking animation while moving
  if (!isMoving) {
    isMoving = true;
    if (actions['Walking'] && currentAnimName !== 'Walking') {
      playAnimation('Walking', 0.2);
    }
  }

  // Reset timer to return to selected animation
  clearTimeout(moveTimeout);
  moveTimeout = setTimeout(() => {
    isMoving = false;
    const selected = animSelect.value;
    if (selected && actions[selected] && currentAnimName !== selected) {
      playAnimation(selected, 0.3);
    }
  }, 350);

  updateStatus(`Posición: (${mascotPos.x.toFixed(2)}m, ${mascotPos.z.toFixed(2)}m)`);
}

function resetPosition() {
  mascotPos.x = 0;
  mascotPos.z = 0;
  targetRotation = 0;
  if (characterModel) {
    characterModel.position.x = 0;
    characterModel.position.z = 0;
    characterModel.rotation.y = 0;
  }
  neonRing.position.x = 0;
  neonRing.position.z = 0;
  controls.target.set(0, 0.85, 0);
  updateStatus('Posición centrada en el piso.');
}

// Camera Presets
function setCameraView(view) {
  document.querySelectorAll('.stage-camera-tools .tool-btn').forEach((b) => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.stage-camera-tools .tool-btn[data-view="${view}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const px = mascotPos.x;
  const pz = mascotPos.z;

  if (view === 'front') {
    camera.position.set(px, 1.25, pz + 3.8);
    controls.target.set(px, 0.85, pz);
  } else if (view === 'full') {
    camera.position.set(px, 1.1, pz + 4.6);
    controls.target.set(px, 0.8, pz);
  } else if (view === 'close') {
    camera.position.set(px, 1.45, pz + 1.45);
    controls.target.set(px, 1.35, pz);
  } else if (view === 'orbit') {
    camera.position.set(px + 2.2, 1.6, pz + 3.2);
    controls.target.set(px, 0.85, pz);
  }
  controls.update();
}

// Export GIF function
async function exportGif() {
  if (typeof GIF === 'undefined') {
    updateStatus('Cargando motor de GIF...');
    await loadGifLibrary();
  }

  btnExportGif.disabled = true;
  updateStatus('Generando GIF cuadro por cuadro...');

  // Setup worker using blob to bypass CORS security
  let workerUrl = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js';
  try {
    const res = await fetch(workerUrl);
    const script = await res.text();
    const blob = new Blob([script], { type: 'application/javascript' });
    workerUrl = URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Fallback worker script URL', err);
  }

  const durationSec = parseFloat(rangeDuration.value) || 3.0;
  const fps = 20;
  const totalFrames = Math.round(durationSec * fps);
  const frameDelay = Math.round(1000 / fps);

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: workerUrl,
  });

  // Temporarily pause main loop to render exact frames
  const wasPlaying = isPlaying;
  isPlaying = false;

  const dt = durationSec / totalFrames;
  for (let i = 0; i < totalFrames; i++) {
    if (mixer) {
      mixer.update(dt * animSpeed);
    }
    controls.update();
    renderer.render(scene, camera);

    gif.addFrame(canvas, { copy: true, delay: frameDelay });
    updateStatus(`Capturando GIF: ${Math.round(((i + 1) / totalFrames) * 100)}%`);
    await new Promise((r) => setTimeout(r, 8));
  }

  isPlaying = wasPlaying;

  gif.on('progress', (p) => {
    updateStatus(`Comprimiendo GIF: ${Math.round(p * 100)}%`);
  });

  gif.on('finished', (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giantuchi-${currentAnimName || 'animacion'}.gif`;
    link.click();
    URL.revokeObjectURL(url);
    btnExportGif.disabled = false;
    updateStatus('¡GIF exportado con éxito!');
  });

  gif.render();
}

// Export Snapshot PNG
function exportSnapshot() {
  renderer.render(scene, camera);
  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `giantuchi-foto-3d.png`;
  link.click();
  updateStatus('Captura HD guardada.');
}

// Dynamically load gif.js library
function loadGifLibrary() {
  return new Promise((resolve, reject) => {
    if (window.GIF) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar gif.js'));
    document.head.appendChild(script);
  });
}

function updateStatus(msg) {
  if (statusText) statusText.textContent = msg;
}

function onWindowResize() {
  if (!stageWrap || !camera || !renderer) return;
  const width = stageWrap.clientWidth;
  const height = stageWrap.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Main Render Loop
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer && isPlaying) {
    mixer.update(delta * animSpeed);
  }

  // Continuous movement while holding keys
  if (activeKeys.size > 0 && characterModel) {
    let moveX = 0;
    let moveZ = 0;
    const speed = (parseFloat(rangeStep.value) * 3.2 || 0.9) * delta;

    if (activeKeys.has('up')) moveZ -= speed;
    if (activeKeys.has('down')) moveZ += speed;
    if (activeKeys.has('left')) moveX -= speed;
    if (activeKeys.has('right')) moveX += speed;

    if (moveX !== 0 || moveZ !== 0) {
      targetRotation = Math.atan2(moveX, -moveZ);
      mascotPos.x = Math.max(-2.6, Math.min(2.6, mascotPos.x + moveX));
      mascotPos.z = Math.max(-1.8, Math.min(2.2, mascotPos.z + moveZ));

      characterModel.position.x = mascotPos.x;
      characterModel.position.z = mascotPos.z;
      neonRing.position.x = mascotPos.x;
      neonRing.position.z = mascotPos.z;

      triggerFootstepAudio();

      if (!isMoving) {
        isMoving = true;
        if (actions['Walking'] && currentAnimName !== 'Walking') {
          playAnimation('Walking', 0.2);
        }
      }

      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        isMoving = false;
        const selected = animSelect.value;
        if (selected && actions[selected] && currentAnimName !== selected) {
          playAnimation(selected, 0.3);
        }
      }, 250);
    }
  }

  // Shortest-path angle rotation interpolation
  if (characterModel) {
    let diff = targetRotation - characterModel.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    characterModel.rotation.y += diff * 0.18;
  }

  // Smooth camera target tracking to follow mascot
  controls.target.x = THREE.MathUtils.lerp(controls.target.x, mascotPos.x, 0.08);
  controls.target.z = THREE.MathUtils.lerp(controls.target.z, mascotPos.z, 0.08);

  // Animate floor neon ring pulse
  if (neonRing) {
    const time = clock.getElapsedTime();
    neonRing.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
  }

  controls.update();
  renderer.render(scene, camera);
}

// Event Listeners
function setupEvents() {
  // Animation Select
  animSelect.addEventListener('change', (e) => {
    playAnimation(e.target.value);
  });

  // Play / Pause
  btnPlayPause.addEventListener('click', () => {
    isPlaying = !isPlaying;
    btnPlayPause.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
    updateStatus(isPlaying ? 'Animación reanudada.' : 'Animación pausada.');
  });

  // Reset Pose
  btnResetPose.addEventListener('click', () => {
    if (currentAction) {
      currentAction.reset();
      currentAction.play();
    }
  });

  // Speed Slider
  rangeSpeed.addEventListener('input', (e) => {
    animSpeed = parseFloat(e.target.value);
    outputSpeed.textContent = `${animSpeed.toFixed(1)}x`;
    if (currentAction) currentAction.timeScale = animSpeed;
  });

  // Step Distance Slider
  rangeStep.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    outputStep.textContent = `${val.toFixed(2)} m`;
  });

  // GIF Duration Slider
  rangeDuration.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    outputDuration.textContent = `${val.toFixed(1)} s`;
  });

  // Reset Position
  btnResetPos.addEventListener('click', resetPosition);

  // Quick Action Chips
  document.querySelectorAll('.chip-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const anim = btn.dataset.trigger;
      if (actions[anim]) {
        animSelect.value = anim;
        playAnimation(anim);
      }
    });
  });

  // D-Pad Buttons
  document.querySelectorAll('.move-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      moveMascot(btn.dataset.dir);
    });
  });

  // Keyboard navigation (Arrow keys & WASD)
  window.addEventListener('keydown', (e) => {
    const keyMap = {
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    };

    const dir = keyMap[e.code] || keyMap[e.key];
    if (dir) {
      e.preventDefault();
      activeKeys.add(dir);
      const btn = document.querySelector(`.move-btn[data-dir="${dir}"]`);
      if (btn) btn.classList.add('pressed');
      moveMascot(dir);
    }

    if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    }
  });

  window.addEventListener('keyup', (e) => {
    const keyMap = {
      ArrowUp: 'up',
      KeyW: 'up',
      ArrowDown: 'down',
      KeyS: 'down',
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
    };
    const dir = keyMap[e.code] || keyMap[e.key];
    if (dir) {
      activeKeys.delete(dir);
      const btn = document.querySelector(`.move-btn[data-dir="${dir}"]`);
      if (btn) btn.classList.remove('pressed');
    }
  });

  // Camera Presets
  document.querySelectorAll('.stage-camera-tools .tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      setCameraView(btn.dataset.view);
    });
  });

  // Environment Toggles
  toggleBg.addEventListener('change', (e) => {
    if (e.target.checked) {
      scene.background = bgTexture;
      floorMesh.material.opacity = 0.85;
      floorMesh.material.transparent = true;
    } else {
      scene.background = new THREE.Color(0x0c0d18);
      floorMesh.material.opacity = 1.0;
      floorMesh.material.transparent = false;
    }
  });

  toggleFloor.addEventListener('change', (e) => {
    floorGroup.visible = e.target.checked;
  });

  toggleShadows.addEventListener('change', (e) => {
    sunLight.castShadow = e.target.checked;
    shadowPlane.visible = e.target.checked;
  });

  toggleNeon.addEventListener('change', (e) => {
    neonLight1.visible = e.target.checked;
    neonLight2.visible = e.target.checked;
    neonRing.visible = e.target.checked;
  });

  // Export Buttons
  btnExportGif.addEventListener('click', () => {
    audio.playSfx('click');
    exportGif();
  });
  btnExportPng.addEventListener('click', () => {
    audio.playSfx('click');
    exportSnapshot();
  });

  // Audio Controls Wiring
  function updateMusicUI() {
    const isPlaying = audio.isPlayingMusic;
    if (isPlaying) {
      btnMusicToggle.classList.add('playing');
      btnTopAudio.classList.add('playing');
      musicPlayIcon.textContent = '⏸';
      musicBtnText.textContent = 'Pausar Música';
      topSoundWave.style.display = 'inline-flex';
    } else {
      btnMusicToggle.classList.remove('playing');
      btnTopAudio.classList.remove('playing');
      musicPlayIcon.textContent = '▶';
      musicBtnText.textContent = 'Iniciar Música';
      topSoundWave.style.display = 'none';
    }
  }

  function updateMuteUI(isMuted) {
    const icon = isMuted ? '🔇' : '🔊';
    btnMuteToggle.textContent = icon;
    btnTopMute.textContent = icon;
  }

  btnMusicToggle.addEventListener('click', () => {
    audio.playSfx('click');
    audio.toggleMusic();
    updateMusicUI();
  });

  btnTopAudio.addEventListener('click', () => {
    audio.playSfx('click');
    audio.toggleMusic();
    updateMusicUI();
  });

  btnMuteToggle.addEventListener('click', () => {
    const muted = audio.toggleMute();
    updateMuteUI(muted);
  });

  btnTopMute.addEventListener('click', () => {
    const muted = audio.toggleMute();
    updateMuteUI(muted);
  });

  trackSelect.addEventListener('change', (e) => {
    audio.playSfx('click');
    const val = e.target.value;
    if (val === 'custom') {
      customAudioInput.click();
    } else {
      audio.startMusic(val);
      updateMusicUI();
    }
  });

  customAudioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      audio.loadCustomAudioFile(file);
      updateMusicUI();
      updateStatus(`Reproduciendo: ${file.name}`);
    }
  });

  rangeMusicVol.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.setMusicVolume(val);
    outputMusicVol.textContent = `${Math.round(val * 100)}%`;
  });

  rangeSfxVol.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    audio.setSfxVolume(val);
    outputSfxVol.textContent = `${Math.round(val * 100)}%`;
  });

  toggleSfx.addEventListener('change', (e) => {
    audio.sfxEnabled = e.target.checked;
    if (e.target.checked) audio.playSfx('click');
  });

  // Preload gif.js silently in the background
  loadGifLibrary().catch((e) => console.log('Preload gif.js error', e));

  // Audio unlock on user interaction (mouse, touch, key)
  const unlockAudio = () => {
    audio.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio, { passive: true });

  // Drag and Drop support for 3D model files (.gltf/.glb) and music files (.mp3/.wav)
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const name = file.name.toLowerCase();

    if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg')) {
      audio.loadCustomAudioFile(file);
      updateMusicUI();
      updateStatus(`Música cargada: ${file.name}`);
    } else if (name.endsWith('.gltf') || name.endsWith('.glb')) {
      const url = URL.createObjectURL(file);
      loadingOverlay.classList.remove('hidden');
      loadingText.textContent = `Cargando ${file.name}...`;
      const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        if (characterModel) scene.remove(characterModel);
        characterModel = gltf.scene;
        characterModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        const box = new THREE.Box3().setFromObject(characterModel);
        characterModel.position.set(0, -box.min.y, 0);
        mascotPos.y = -box.min.y;
        scene.add(characterModel);
        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(characterModel);
          animSelect.innerHTML = '';
          gltf.animations.forEach((clip) => {
            actions[clip.name] = mixer.clipAction(clip);
            const opt = document.createElement('option');
            opt.value = clip.name;
            opt.textContent = animLabels[clip.name] || clip.name;
            animSelect.appendChild(opt);
          });
          playAnimation(gltf.animations[0].name);
        }
        loadingOverlay.classList.add('hidden');
        updateStatus(`Modelo 3D cargado: ${file.name}`);
      });
    }
  });
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  initScene();
  setupEvents();
  loadModel();
});
