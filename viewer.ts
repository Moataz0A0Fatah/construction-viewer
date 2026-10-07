import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { loadSkpModel } from './skp-loader';
import { setupObjectPicking, renderObjectInfo } from './object-info';
import { MeasurementTool } from './measurement';
import { initDwfViewer, destroyDwfViewer } from './dwf-panel';

export interface ViewerContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  modelRoot: THREE.Group;
  measurement: MeasurementTool;
}

export async function createViewer(
  viewportEl: HTMLElement,
  infoEl: HTMLElement,
  dwfContainerEl: HTMLElement
): Promise<ViewerContext> {
  // --- Scene ---
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // --- Camera ---
  const camera = new THREE.PerspectiveCamera(
    60,
    viewportEl.clientWidth / viewportEl.clientHeight,
    0.1,
    10000
  );
  camera.position.set(15, 12, 15);

  // --- WebGL Renderer ---
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(viewportEl.clientWidth, viewportEl.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  viewportEl.appendChild(renderer.domElement);

  // --- CSS2D Renderer (for measurement labels) ---
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(viewportEl.clientWidth, viewportEl.clientHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  viewportEl.appendChild(labelRenderer.domElement);

  // --- Orbit Controls ---
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;

  // --- Lights ---
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(20, 30, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-15, 10, -15);
  scene.add(fillLight);

  // --- Grid ---
  const grid = new THREE.GridHelper(200, 200, 0x0f3460, 0x0f3460);
  scene.add(grid);

  // --- Measurement Tool ---
  const measurement = new MeasurementTool(scene, camera, renderer);

  // --- Placeholder model root ---
  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  // --- Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }
  animate();

  // --- Resize Handling ---
  window.addEventListener('resize', () => {
    const w = viewportEl.clientWidth;
    const h = viewportEl.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labelRenderer.setSize(w, h);
  });

  return {
    scene,
    camera,
    renderer,
    labelRenderer,
    controls,
    modelRoot,
    measurement
  };
}