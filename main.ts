import './styles.css';
import * as THREE from 'three';
import { createViewer } from './viewer';
import { loadSkpModel } from './skp-loader';
import { setupObjectPicking, renderObjectInfo } from './object-info';
import { initDwfViewer, destroyDwfViewer } from './dwf-panel';

// --- Paths to your assets ---
const SKP_URL = '/models/sample.skp';
const DWF_URL = '/sheets/sample.dwf';

async function main() {
  const viewportEl = document.getElementById('viewport')!;
  const infoEl = document.getElementById('info-content')!;
  const dwfPanel = document.getElementById('dwf-panel')!;
  const dwfContainer = document.getElementById('dwf-container')!;

  // 1. Create the Three.js viewer
  const ctx = await createViewer(viewportEl, infoEl, dwfContainer);

  // 2. Load the SketchUp model (converted to GLB in-browser)
  try {
    const model = await loadSkpModel(SKP_URL);
    ctx.modelRoot.add(model);

    // Frame the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 2;

    ctx.controls.target.copy(center);
    ctx.camera.position.set(
      center.x + dist,
      center.y + dist * 0.8,
      center.z + dist
    );
    ctx.controls.update();
  } catch (err) {
    console.error('Failed to load SKP model:', err);
    infoEl.innerHTML =
      '<p class="hint" style="color:#e94560">Could not load sample.skp. Check the public/models folder.</p>';
  }

  // 3. Object picking
  setupObjectPicking(
    ctx.renderer,
    ctx.camera,
    ctx.modelRoot,
    (info) => renderObjectInfo(infoEl, info)
  );

  // 4. Measurement toolbar
  const btnMeasure = document.getElementById('btn-measure')!;
  const btnClearMeasure = document.getElementById('btn-clear-measure')!;

  btnMeasure.addEventListener('click', () => {
    const active = btnMeasure.classList.toggle('active');
    if (active) {
      ctx.measurement.activate();
    } else {
      ctx.measurement.deactivate();
    }
  });

  btnClearMeasure.addEventListener('click', () => {
    ctx.measurement.clear();
  });

  // Forward clicks to the measurement tool
  ctx.renderer.domElement.addEventListener('click', (e) => {
    ctx.measurement.handleClick(e, [ctx.modelRoot]);
  });

  // 5. DWF panel toggle
  const btnToggleDwf = document.getElementById('btn-toggle-dwf')!;
  const btnCloseDwf = document.getElementById('btn-close-dwf')!;

  btnToggleDwf.addEventListener('click', async () => {
    const isHidden = dwfPanel.classList.toggle('hidden');
    if (!isHidden) {
      try {
        await initDwfViewer(dwfContainer, DWF_URL);
      } catch (err) {
        console.error('Failed to load DWF:', err);
        dwfContainer.innerHTML =
          '<p class="hint" style="color:#e94560;padding:1rem;">Could not load sample.dwf.</p>';
      }
    } else {
      destroyDwfViewer();
    }
  });

  btnCloseDwf.addEventListener('click', () => {
    dwfPanel.classList.add('hidden');
    destroyDwfViewer();
  });
}

main();