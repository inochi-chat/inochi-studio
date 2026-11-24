
export function createMoveHierarchyObjectCommand(
  hierarchyOrder,
  object,
  newIndex,
  onChange
) {
  const oldIndex = hierarchyOrder.getIndex(object);

  if (oldIndex === -1 || oldIndex === newIndex) {
    return null;
  }

  return {
    undo() {
      hierarchyOrder.moveToIndex(object, oldIndex);

      if (onChange) {
        onChange(object);
      }
    },

    redo() {
      hierarchyOrder.moveToIndex(object, newIndex);

      if (onChange) {
        onChange(object);
      }
    }
  };
}
