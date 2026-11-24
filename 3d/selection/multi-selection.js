
export function createMultiSelection() {
  const selectedObjects = new Set();

  function add(object) {
    if (!object) return;
    selectedObjects.add(object);
  }

  function remove(object) {
    selectedObjects.delete(object);
  }

  function toggle(object) {
    if (!object) return;

    if (selectedObjects.has(object)) {
      selectedObjects.delete(object);
    } else {
      selectedObjects.add(object);
    }
  }

  function clear() {
    selectedObjects.clear();
  }

  function has(object) {
    return selectedObjects.has(object);
  }

  function getAll() {
    return [...selectedObjects];
  }

  function isEmpty() {
    return selectedObjects.size === 0;
  }

  function count() {
    return selectedObjects.size;
  }

  return {
    add,
    remove,
    toggle,
    clear,
    has,
    getAll,
    isEmpty,
    count
  };
}
