import 'dwf-viewer/styles.css';
import { DwfViewer } from 'dwf-viewer';

let viewer: DwfViewer | null = null;

/**
 * Initializes the DWF viewer inside a container element
 * and loads the given DWF file URL.
 */
export async function initDwfViewer(
  container: HTMLElement,
  dwfUrl: string
): Promise<void> {
  // Clean up any previous instance
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }

  viewer = new DwfViewer(container, {
    wasmUrl: '/dwfv-render.wasm'
  });

  await viewer.load(dwfUrl);
}

/**
 * Disposes the DWF viewer when the panel is closed.
 */
export function destroyDwfViewer(): void {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
}