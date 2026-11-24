
export function createHierarchyOrder(objectManager, scene) {
  function getParent(object) {
    if (!object || !object.parent) return null;
    return object.parent;
  }

  function getSiblings(object) {
    const parent = getParent(object);
    if (!parent) return [];

    if (parent === scene) {
      return objectManager.getAll().filter(item => item.parent === scene);
    }

    return parent.children.filter(child =>
      objectManager.getAll().includes(child)
    );
  }

  function getIndex(object) {
    return getSiblings(object).indexOf(object);
  }

  function canMove(object, target) {
    if (!object || !target || object === target) return false;
    return getParent(object) === getParent(target);
  }

  function move(object, target, position = "before") {
    if (!canMove(object, target)) return false;

    const parent = getParent(object);
    const siblings = getSiblings(object);

    const oldIndex = siblings.indexOf(object);
    const targetIndex = siblings.indexOf(target);

    if (oldIndex < 0 || targetIndex < 0) return false;

    const nextIndex = position === "after"
      ? targetIndex + 1
      : targetIndex;

    if (
      oldIndex === nextIndex ||
      oldIndex + 1 === nextIndex
    ) {
      return false;
    }

    if (parent === scene) {
      const objects = objectManager.getAll();
      const from = objects.indexOf(object);
      const to = objects.indexOf(target);

      if (from < 0 || to < 0) return false;

      objects.splice(from, 1);
      const insertIndex = position === "after"
        ? objects.indexOf(target) + 1
        : objects.indexOf(target);

      objects.splice(insertIndex, 0, object);

      return true;
    }

    const children = parent.children;
    const from = children.indexOf(object);
    const to = children.indexOf(target);

    if (from < 0 || to < 0) return false;

    children.splice(from, 1);

    const insertIndex = position === "after"
      ? children.indexOf(target) + 1
      : children.indexOf(target);

    children.splice(insertIndex, 0, object);

    return true;
  }

  return {
    getSiblings,
    getIndex,
    canMove,
    move
  };
}
