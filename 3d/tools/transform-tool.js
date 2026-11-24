
import { TransformControls } from "three/addons/controls/TransformControls.js";

export function createTransformTool(camera, renderer, scene, orbit) {
  const transform = new TransformControls(
    camera,
    renderer.domElement
  );

  scene.add(transform.getHelper());

  transform.addEventListener("dragging-changed", (event) => {
    orbit.enabled = !event.value;
  });

  return {
    attach(object) {
      transform.attach(object);
    },

    detach() {
      transform.detach();
    },

    setMode(mode) {
      transform.setMode(mode);
    },

    get dragging() {
      return transform.dragging;
    },

    addEventListener(type, callback) {
      transform.addEventListener(type, callback);
    }
  };
}
