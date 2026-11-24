
export function createAddObjectCommand(
  objectManager,
  geometry,
  type,
  onChange
) {
  let object = null;

  return {
    undo() {
      if (!object) return;

      objectManager.detach(object);

      if (onChange) onChange(null);
    },

    redo() {
      if (!object) {
        object = objectManager.add(geometry, type);
      } else {
        objectManager.restore(object);
      }

      if (onChange) onChange(object);
    }
  };
}

export function createDeleteObjectCommand(
  objectManager,
  object,
  onChange
) {
  const index = objectManager.getIndex(object);

  return {
    undo() {
      objectManager.restore(object, index);

      if (onChange) onChange(object);
    },

    redo() {
      objectManager.detach(object);

      if (onChange) onChange(null);
    }
  };
}
