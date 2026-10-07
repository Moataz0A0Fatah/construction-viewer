import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

interface MeasurementState {
  active: boolean;
  points: THREE.Vector3[];
  markers: THREE.Object3D[];
}

export class MeasurementTool {
  private state: MeasurementState = {
    active: false,
    points: [],
    markers: []
  };

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private renderer: THREE.WebGLRenderer;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  activate(): void {
    this.state.active = true;
    this.state.points = [];
    this.renderer.domElement.style.cursor = 'crosshair';
  }

  deactivate(): void {
    this.state.active = false;
    this.renderer.domElement.style.cursor = 'default';
  }

  handleClick(event: MouseEvent, rootObjects: THREE.Object3D[]): void {
    if (!this.state.active) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(rootObjects, true);
    if (intersects.length === 0) return;

    const point = intersects[0].point.clone();
    this.state.points.push(point);
    this.addMarker(point);

    if (this.state.points.length === 2) {
      this.drawMeasurement(this.state.points[0], this.state.points[1]);
      this.state.points = [];
    }
  }

  private addMarker(point: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.05, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xe94560 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    this.scene.add(sphere);
    this.state.markers.push(sphere);
  }

  private drawMeasurement(a: THREE.Vector3, b: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([a, b]);
    const material = new THREE.LineBasicMaterial({ color: 0xe94560 });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.state.markers.push(line);

    const distance = a.distanceTo(b);

    const div = document.createElement('div');
    div.className = 'measurement-label';
    div.textContent = `${distance.toFixed(2)} m`;

    const label = new CSS2DObject(div);
    label.position.copy(a.clone().add(b).multiplyScalar(0.5));
    this.scene.add(label);
    this.state.markers.push(label);
  }

  clear(): void {
    for (const marker of this.state.markers) {
      this.scene.remove(marker);
      if ((marker as THREE.Mesh).geometry) {
        (marker as THREE.Mesh).geometry.dispose();
      }
      if ((marker as THREE.Mesh).material) {
        const mat = (marker as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }
    this.state.markers = [];
    this.state.points = [];
  }
}