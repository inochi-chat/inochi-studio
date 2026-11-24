
export function createObjectHierarchy(scene, objectManager) {
  function isManaged(object) {
    return !!object &&
      objectManager.getAll().includes(object);
  }

  function canSetParent(child, parent) {
    if (!isManaged(child) || !isManaged(parent)) return false;
    if (child === parent) return false;

    // 親にしようとしているオブジェクトが
    // 子自身の子孫なら循環になるため禁止
    let current = parent;

    while (current && current !== scene) {
      if (current === child) return false;
      current = current.parent;
    }

    return true;
  }

  function setParent(child, parent) {
    if (!canSetParent(child, parent)) return false;

    // ワールド座標を維持して親を変更
    parent.attach(child);
    return true;
  }

  function removeParent(object) {
    if (!isManaged(object)) return false;

    const parent = object.parent;

    if (!parent || parent === scene) return false;

    // シーン直下に戻す
    scene.attach(object);
    return true;
  }

  function getChildren(object) {
    if (!isManaged(object)) return [];

    return object.children.filter(child =>
      isManaged(child)
    );
  }

  function getParent(object) {
    if (!isManaged(object)) return null;

    const parent = object.parent;

    if (!parent || parent === scene) return null;

    return isManaged(parent) ? parent : null;
  }

  function hasChildren(object) {
    return getChildren(object).length > 0;
  }

  return {
    isManaged,
    canSetParent,
    setParent,
    removeParent,
    getChildren,
    getParent,
    hasChildren
  };
}
