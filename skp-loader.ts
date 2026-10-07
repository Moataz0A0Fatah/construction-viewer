import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SkpFile, toGLB } from 'openskp';

/**
 * Loads a .skp file from a URL, converts it to GLB in-browser,
 * and returns a THREE.Group with the parsed geometry.
 */
export async function loadSkpModel(url: string): Promise<THREE.Group> {
  // 1. Fetch the .skp file as an ArrayBuffer
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SKP: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();

  // 2. Parse the SKP and build a GLB scene
  //    openskp runs entirely in the browser (WASM-backed).
  const model = SkpFile.parse(buffer);
  const scene = model.buildScene();
  const glb = toGLB(scene);

  // 3. Load the GLB into Three.js
  const loader = new GLTFLoader();
  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise<THREE.Group>((resolve, reject) => {
    loader.load(
      objectUrl,
      (gltf) => {
        URL.revokeObjectURL(objectUrl);
        const group = gltf.scene;

        // Enable shadows and store the original name for picking
        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Store a human-readable name for the object-info panel
            child.userData.displayName =
              child.name || `Object ${child.id}`;
          }
        });

        resolve(group);
      },
      undefined,
      (err) => {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    );
  });
}