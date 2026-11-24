
export function createHierarchyOrder(objectManager, scene) {
  function getParent(object) {
    return object?.parent || null;
  }

  function getSiblings(object) {
    const parent = getParent(object);

    if (!parent) return [];

    if (parent === scene) {
      return objectManager.getAll().filter(
        item => item.parent === scene
      );
    }

    return parent.children.filter(
      child => objectManager.getAll().includes(child)
    );
  }

  function getIndex(object) {
    return getSiblings(object).indexOf(object);
  }

  function canMove(object, target) {
    if (!object || !target || object === target) {
      return false;
    }

    return getParent(object) === getParent(target);
  }

  function moveToIndex(object, newIndex) {
    const parent = getParent(object);
    if (!parent) return false;

    const siblings = getSiblings(object);
    const oldIndex = siblings.indexOf(object);

    if (oldIndex === -1) return false;

    const safeIndex = Math.max(
      0,
      Math.min(newIndex, siblings.length - 1)
    );

    if (oldIndex === safeIndex) return false;

    if (parent === scene) {
      const allObjects = objectManager.getAll();
      const currentIndex = allObjects.indexOf(object);

      if (currentIndex === -1) return false;

      const remainingRoots = siblings.filter(
        item => item !== object
      );

      const target = remainingRoots[safeIndex];

      if (target) {
        const targetIndex = allObjects.indexOf(target);
        const insertIndex = safeIndex > oldIndex
          ? targetIndex + 1
          : targetIndex;

        return objectManager.move(
          object,
          insertIndex > currentIndex
            ? insertIndex - 1
            : insertIndex
        );
      }

      return objectManager.move(
        object,
        allObjects.length - 1
      );
    }

    parent.children.splice(oldIndex, 1);
    parent.children.splice(safeIndex, 0, object);

    return true;
  }

  function move(object, target, position = "before") {
    if (!canMove(object, target)) return false;

    const siblings = getSiblings(object);
    const targetIndex = siblings.indexOf(target);

    if (targetIndex === -1) return false;

    const newIndex = targetIndex +
      (position === "after" ? 1 : 0);

    const adjustedIndex =
      getIndex(object) < newIndex
        ? newIndex - 1
        : newIndex;

    return moveToIndex(object, adjustedIndex);
  }

  return {
    getParent,
    getSiblings,
    getIndex,
    canMove,
    move,
    moveToIndex
  };
}
