
export function createVisibilityCommand(
  visibility,
  object,
  newVisible,
  onChange
) {
  if (!object) return null;

  const oldVisible = visibility.isVisible(object);

  if (oldVisible === newVisible) return null;

  return {
    undo() {
      visibility.setVisible(object, oldVisible);

      if (onChange) {
        onChange(object);
      }
    },

    redo() {
      visibility.setVisible(object, newVisible);

      if (onChange) {
        onChange(object);
      }
    }
  };
}
