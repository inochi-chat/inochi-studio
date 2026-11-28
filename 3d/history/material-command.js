
export function createMaterialCommand(
  object,
  before,
  after,
  onChange
) {
  const material = object.material;

  function apply(state) {
    material.color.setHex(state.color);
    material.metalness = state.metalness;
    material.roughness = state.roughness;
    material.opacity = state.opacity;
    material.transparent = state.transparent;

    material.needsUpdate = true;

    if (onChange) {
      onChange(object);
    }
  }

  return {
    undo() {
      apply(before);
    },

    redo() {
      apply(after);
    }
  };
}
