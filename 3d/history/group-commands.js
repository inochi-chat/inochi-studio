
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
      if (!group) {
        group = objectGroup.createGroup(selectedObjects);
      } else {
        // グループ解除後に再度グループ化
        group = objectGroup.createGroup(selectedObjects);
      }

      if (onChange) onChange(group);
    }
  };
}

export function createUngroupCommand(
  objectGroup,
  group,
  onChange
) {
  const objects = objectGroup.getGroupObjects(group);

  return {
    undo() {
      const restoredGroup = objectGroup.createGroup(objects);

      if (onChange) onChange(restoredGroup);
    },

    redo() {
      const currentGroups = objectGroup.getAllGroups();
      const target = currentGroups.find(item =>
        objectGroup.getGroupObjects(item).every(object =>
          objects.includes(object)
        )
      );

      if (target) {
        objectGroup.ungroup(target);
      }

      if (onChange) onChange(null);
    }
  };
}
