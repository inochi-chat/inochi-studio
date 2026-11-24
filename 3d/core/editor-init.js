
import { createScene } from "./scene.js";
import { createCamera } from "./camera.js";
import { createRenderer } from "./renderer.js";
import { createLighting } from "./lighting.js";
import { createGrid } from "./grid.js";

export function initializeEditor(canvas) {
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer(canvas);

  createLighting(scene);
  createGrid(scene);

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  window.addEventListener("resize", resize);

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  resize();

  return {
    scene,
    camera,
    renderer,
    resize
  };
}
