
export function createSetParentCommand(
  hierarchy,
  child,
  newParent,
  onChange
) {
  // 不正な親子関係は履歴に登録しない
  if (!hierarchy.canSetParent(child, newParent)) {
    return null;
  }

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

  // 親がいない場合は解除コマンドを作らない
  if (!oldParent) return null;

  return {
    undo() {
      hierarchy.setParent(child, oldParent);

      if (onChange) onChange(child);
    },

    redo() {
      hierarchy.removeParent(child);

      if (onChange) onChange(child);
    }
  };
}
