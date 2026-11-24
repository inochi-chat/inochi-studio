
export function createLockCommand(
  objectLock,
  object,
  newLocked,
  onChange
) {
  if (!object) return null;

  const oldLocked = objectLock.isLocked(object);

  if (oldLocked === newLocked) return null;

  function apply(locked) {
    if (locked) {
      objectLock.lock(object);
    } else {
      objectLock.unlock(object);
    }

    if (onChange) onChange(object);
  }

  return {
    undo() {
      apply(oldLocked);
    },

    redo() {
      apply(newLocked);
    }
  };
}
