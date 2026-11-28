
export function createMeshSettings() {
  let selectionMode = "vertex";
  let multiSelect = false;

  let gizmoVisible = true;

  let sculptEnabled = false;
  let sculptMode = "pushpull";
  let sculptRadius = 0.5;
  let sculptStrength = 0.1;

  let mirrorX = false;

  return {
    getSelectionSettings() {
      return {
        mode: selectionMode,
        multiSelect
      };
    },

    setSelectionMode(mode) {
      if (!["vertex", "edge", "face"].includes(mode)) return;
      selectionMode = mode;
    },

    setMultiSelect(enabled) {
      multiSelect = Boolean(enabled);
    },

    getGizmoVisible() {
      return gizmoVisible;
    },

    setGizmoVisible(visible) {
      gizmoVisible = Boolean(visible);
    },

    getSculptSettings() {
      return {
        enabled: sculptEnabled,
        mode: sculptMode,
        radius: sculptRadius,
        strength: sculptStrength
      };
    },

    setSculptSettings(enabled, mode, radius, strength) {
      if (
        !["pushpull", "smooth", "inflate"].includes(mode)
      ) return;

      sculptEnabled = Boolean(enabled);
      sculptMode = mode;

      if (Number.isFinite(radius) && radius > 0) {
        sculptRadius = radius;
      }

      if (Number.isFinite(strength)) {
        sculptStrength = strength;
      }
    },

    getMirrorX() {
      return mirrorX;
    },

    setMirrorX(enabled) {
      mirrorX = Boolean(enabled);
    },

    reset() {
      selectionMode = "vertex";
      multiSelect = false;
      gizmoVisible = true;
      sculptEnabled = false;
      sculptMode = "pushpull";
      sculptRadius = 0.5;
      sculptStrength = 0.1;
      mirrorX = false;
    }
  };
}
