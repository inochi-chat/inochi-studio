
export function createSetParentCommand(
  hierarchy,
  child,
  newParent,
  onChange
) {
  const oldParent = hierarchy.getParent(child);

  return {
    undo() {
      if (oldParent) {
        hierarchy.setParent(child, oldParent);
      } else {
        hierarchy.removeParent(child);
      }

      if (onChange) onChange(child);
    },

    redo() {
      hierarchy.setParent(child, newParent);

      if (onChange) onChange(child);
    }
  };
}

export function createRemoveParentCommand(
  hierarchy,
  child,
  onChange
) {
  const oldParent = hierarchy.getParent(child);

  return {
    undo() {
      if (oldParent) {
        hierarchy.setParent(child, oldParent);
      }

      if (onChange) onChange(child);
    },

    redo() {
      hierarchy.removeParent(child);

      if (onChange) onChange(child);
    }
  };
}
