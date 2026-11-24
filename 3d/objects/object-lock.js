
export function createObjectLock() {
  const lockedObjects = new Set();

  function lock(object) {
    if (!object) return false;

    lockedObjects.add(object);
    return true;
  }

  function unlock(object) {
    if (!object) return false;

    lockedObjects.delete(object);
    return true;
  }

  function toggle(object) {
    if (!object) return false;

    if (lockedObjects.has(object)) {
      lockedObjects.delete(object);
      return false;
    }

    lockedObjects.add(object);
    return true;
  }

  function isLocked(object) {
    return lockedObjects.has(object);
  }

  return {
    lock,
    unlock,
    toggle,
    isLocked
  };
}
