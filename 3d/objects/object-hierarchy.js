
export function createObjectHierarchy() {
  function setParent(child, parent) {
    if (!child || !parent) return false;

    // 自分自身を親にはできない
    if (child === parent) return false;

    // 子を親にすると循環する場合は禁止
    let current = parent;

    while (current) {
      if (current === child) return false;
      current = current.parent;
    }

    parent.add(child);

    return true;
  }

  function removeParent(object, scene) {
    if (!object || !object.parent) return;

    const parent = object.parent;

    parent.remove(object);
    scene.add(object);
  }

  function getChildren(object) {
    if (!object) return [];

    return [...object.children];
  }

  function getParent(object, scene) {
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
