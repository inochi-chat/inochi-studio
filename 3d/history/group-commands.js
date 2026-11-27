
export function createGroupCommand(objectGroup, selectedObjects, onChange) {
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

export function createUngroupCommand(objectGroup, targetGroup, onChange) {
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

export function createRenameGroupCommand(group, newName, onChange) {
  const oldName = group.name;

  return {
    undo() {
      group.name = oldName;

      if (onChange) onChange(group);
    },

    redo() {
      group.name = newName;

      if (onChange) onChange(group);
    }
  };
}

// グループと中のオブジェクトをまとめて削除する
export function createDeleteGroupCommand(
  objectGroup,
  objectManager,
  targetGroup,
  onChange
) {
  const children = objectGroup.getGroupObjects(targetGroup);

  const targets = children
    .map(object => ({
      object,
      index: objectManager.getIndex(object)
    }))
    .filter(item => item.index !== -1);

  let deleted = false;

  return {
    undo() {
      if (!deleted) return;

      // 先にグループを復元
      if (!objectGroup.restoreGroup(targetGroup)) return;

      // 子オブジェクトを元の順番で復元
      const sorted = [...targets].sort(
        (a, b) => a.index - b.index
      );

      for (const item of sorted) {
        objectManager.restore(
          item.object,
          item.index
        );
      }

      deleted = false;

      if (onChange) onChange(targetGroup);
    },

    redo() {
      if (deleted) return;

      // 子オブジェクトを先に退避
      const sorted = [...targets].sort(
        (a, b) => b.index - a.index
      );

      for (const item of sorted) {
        objectManager.detach(item.object);
      }

      // 最後にグループを削除
      if (!objectGroup.deleteGroup(targetGroup)) {
        // 失敗した場合は子を戻す
        const restoreTargets = [...targets].sort(
          (a, b) => a.index - b.index
        );

        for (const item of restoreTargets) {
          objectManager.restore(
            item.object,
            item.index
          );
        }

        return;
      }

      deleted = true;

      if (onChange) onChange(null);
    }
  };
}
