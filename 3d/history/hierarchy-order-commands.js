
export function createMoveObjectCommand(
  objectManager,
  object,
  newIndex,
  onChange
) {
  const oldIndex = objectManager.getIndex(object);

  if (oldIndex === -1 || oldIndex === newIndex) {
    return null;
  }

  return {
    undo() {
      objectManager.move(object, oldIndex);

      if (onChange) {
        onChange(object);
      }
    },

    redo() {
      objectManager.move(object, newIndex);

      if (onChange) {
        onChange(object);
      }
    }
  };
}
