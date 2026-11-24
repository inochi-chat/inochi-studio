
import { TransformControls } from "three/addons/controls/TransformControls.js";

export function createTransformTool(
  camera,
  renderer,
  scene,
  orbit,
  objectLock
) {
  const transform = new TransformControls(
    camera,
    renderer.domElement
  );

  scene.add(transform.getHelper());

  transform.addEventListener("dragging-changed", event => {
    orbit.enabled = !event.value;
  });

  return {
    attach(object) {
      if (!object) {
        transform.detach();
        return;
      }

      if (objectLock?.isLocked(object)) {
        transform.detach();
        return;
      }

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
