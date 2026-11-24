
export function createObjectHierarchy(scene) {
  function setParent(child, parent) {
    if (!child || !parent) return false;
    if (child === parent) return false;

    // 循環する親子関係を防止
    let current = parent;

    while (current) {
      if (current === child) return false;
      current = current.parent;
    }

    // ワールド座標を維持して親を変更
    parent.attach(child);

    return true;
  }

  function removeParent(object) {
    if (!object || !object.parent) return false;

    // ワールド座標を維持して親子関係を解除
    scene.attach(object);

    return true;
  }

  function getChildren(object) {
    if (!object) return [];

    return [...object.children];
  }

  function getParent(object) {
    if (!object || object.parent === scene) {
      return null;
    }

    return object.parent;
  }

  function hasChildren(object) {
    return !!object && object.children.length > 0;
  }

  return {
    setParent,
    removeParent,
    getChildren,
    getParent,
    hasChildren
  };
}
