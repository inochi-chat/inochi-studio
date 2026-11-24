
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
    return !!object &&
      !!target &&
      object !== target &&
      getParent(object) === getParent(target);
  }

  function moveToIndex(object, newIndex) {
    const parent = getParent(object);
    if (!parent) return false;

    const siblings = getSiblings(object);
    const oldIndex = siblings.indexOf(object);

    if (oldIndex < 0 || siblings.length < 2) return false;

    const safeIndex = Math.max(
      0,
      Math.min(newIndex, siblings.length - 1)
    );

    if (oldIndex === safeIndex) return false;

    if (parent === scene) {
      const remaining = siblings.filter(
        item => item !== object
      );

      let globalIndex;

      if (safeIndex < remaining.length) {
        globalIndex = objectManager.getAll().indexOf(
          remaining[safeIndex]
        );
      } else {
        const previous = remaining[safeIndex - 1];
        globalIndex =
          objectManager.getAll().indexOf(previous) + 1;
      }

      return objectManager.move(object, globalIndex);
    }

    const oldChildIndex = parent.children.indexOf(object);
    if (oldChildIndex < 0) return false;

    const remaining = parent.children.filter(
      child => child !== object
    );

    const target = siblings.filter(
      child => child !== object
    )[safeIndex];

    let insertIndex;

    if (target) {
      insertIndex = remaining.indexOf(target);
    } else {
      const previous = siblings.filter(
        child => child !== object
      )[safeIndex - 1];

      insertIndex = remaining.indexOf(previous) + 1;
    }

    parent.children.splice(oldChildIndex, 1);
    parent.children.splice(insertIndex, 0, object);

    return true;
  }

  function move(object, target, position = "before") {
    if (!canMove(object, target)) return false;

    const siblings = getSiblings(object);
    const targetIndex = siblings.indexOf(target);
    const oldIndex = getIndex(object);

    if (targetIndex < 0) return false;

    let newIndex = targetIndex +
      (position === "after" ? 1 : 0);

    if (oldIndex < newIndex) {
      newIndex--;
    }

    return moveToIndex(object, newIndex);
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
