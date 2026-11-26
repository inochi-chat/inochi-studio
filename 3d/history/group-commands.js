
export function createGroupCommand(
  objectGroup,
  selectedObjects,
  onChange
) {
  let group = null;

  return {
    undo() {
      if (!group) return;

      objectGroup.ungroup(group);

      if (onChange) onChange(null);
    },

    redo() {
      group = objectGroup.createGroup(selectedObjects);

      if (onChange) onChange(group);
    }
  };
}

export function createUngroupCommand(
  objectGroup,
  targetGroup,
  onChange
) {
  const objects = objectGroup.getGroupObjects(targetGroup);
  let group = targetGroup;

  return {
    undo() {
      group = objectGroup.createGroup(objects);

      if (onChange) onChange(group);
    },

    redo() {
      if (!group) return;

      objectGroup.ungroup(group);

      if (onChange) onChange(null);
    }
  };
}
