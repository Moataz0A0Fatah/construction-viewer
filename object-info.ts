import * as THREE from 'three';

export interface ObjectInfo {
  name: string;
  properties: Record<string, string>;
}

/**
 * Sets up click-to-select on a Three.js renderer.
 * Returns a cleanup function.
 */
export function setupObjectPicking(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  scene: THREE.Scene,
  onSelect: (info: ObjectInfo | null) => void
): () => void {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const handleClick = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length === 0) {
      onSelect(null);
      return;
    }

    // Find the first intersect that belongs to a mesh
    const hit = intersects.find((i) => (i.object as THREE.Mesh).isMesh);
    if (!hit) {
      onSelect(null);
      return;
    }

    const obj = hit.object;
    const displayName =
      (obj.userData.displayName as string) || obj.name || 'Unnamed Object';

    // Collect basic properties from userData and geometry
    const properties: Record<string, string> = {};
    if (obj.userData) {
      for (const [key, value] of Object.entries(obj.userData)) {
        if (key !== 'displayName') {
          properties[key] = String(value);
        }
      }
    }

    if ((obj as THREE.Mesh).geometry) {
      const geom = (obj as THREE.Mesh).geometry;
      properties['Vertices'] = String(geom.attributes.position?.count ?? 0);
      properties['Triangles'] = String(
        geom.index ? geom.index.count / 3 : 0
      );
    }

    properties['Position'] = `(${obj.position.x.toFixed(2)}, ${obj.position.y.toFixed(2)}, ${obj.position.z.toFixed(2)})`;

    onSelect({ name: displayName, properties });
  };

  renderer.domElement.addEventListener('click', handleClick);
  return () => renderer.domElement.removeEventListener('click', handleClick);
}

/**
 * Renders the object info into a DOM element.
 */
export function renderObjectInfo(
  container: HTMLElement,
  info: ObjectInfo | null
): void {
  if (!info) {
    container.innerHTML =
      '<p class="hint">Click an object in the model to see its name.</p>';
    return;
  }

  let html = `<h3 style="margin-bottom:0.5rem;color:#e94560">${info.name}</h3>`;
  for (const [key, value] of Object.entries(info.properties)) {
    html += `
      <div class="prop-row">
        <span class="prop-key">${key}</span>
        <span>${value}</span>
      </div>`;
  }
  container.innerHTML = html;
}