
export function createObjectDuplicator(objectManager) {
  function duplicate(source) {
    if (!source) return null;

    const copy = source.clone(true);

    copy.geometry = source.geometry.clone();

    if (Array.isArray(source.material)) {
      copy.material = source.material.map(
        material => material.clone()
      );
    } else {
      copy.material = source.material.clone();
    }

    copy.name = `${source.name}_copy`;
    copy.position.x += 1;

    objectManager.restore(copy);

    return copy;
  }

  return {
    duplicate
  };
}
