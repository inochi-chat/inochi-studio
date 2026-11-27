
function copyObjectProperties(source, target) {
  target.name = `${source.name}_Copy`;

  target.position.copy(source.position);
  target.rotation.copy(source.rotation);
  target.scale.copy(source.scale);

  target.visible = source.visible;

  if (Array.isArray(source.material)) {
    target.material = source.material.map(
      material => material.clone()
    );
  } else if (source.material) {
    target.material = source.material.clone();
  }

  return target;
}

export function createAddObjectCommand(
  objectManager,
  geometry,
  type,
  onChange
) {
  let object = null;
  let index = -1;

  return {
    undo() {
      if (!object) return;

      index = objectManager.getIndex(object);
      objectManager.detach(object);

      if (onChange) onChange(null);
    },

    redo() {
      if (!object) {
        object = objectManager.add(geometry, type);
      } else {
        objectManager.restore(object, index);
      }

      if (onChange) onChange(object);
    }
  };
}

export function createDeleteObjectCommand(
  objectManager,
  object,
  onChange
) {
  let index = objectManager.getIndex(object);

  return {
    undo() {
      objectManager.restore(object, index);

      if (onChange) onChange(object);
    },

    redo() {
      index = objectManager.getIndex(object);
      objectManager.detach(object);

      if (onChange) onChange(null);
    }
  };
}

export function createDeleteObjectsCommand(
  objectManager,
  selectedObjects,
  onChange
) {
  const targets = selectedObjects
    .map(object => ({
      object,
      index: objectManager.getIndex(object)
    }))
    .filter(item => item.index !== -1);

  return {
    undo() {
      const sorted = [...targets].sort(
        (a, b) => a.index - b.index
      );

      for (const item of sorted) {
        objectManager.restore(
          item.object,
          item.index
        );
      }

      if (onChange) {
        onChange(sorted[0]?.object ?? null);
      }
    },

    redo() {
      const sorted = [...targets].sort(
        (a, b) => b.index - a.index
      );

      for (const item of sorted) {
        objectManager.detach(item.object);
      }

      if (onChange) onChange(null);
    }
  };
}

export function createDuplicateObjectCommand(
  objectManager,
  sourceObject,
  onChange
) {
  let duplicate = null;
  let index = -1;

  return {
    undo() {
      if (!duplicate) return;

      index = objectManager.getIndex(duplicate);
      objectManager.detach(duplicate);

      if (onChange) onChange(null);
    },

    redo() {
      if (!duplicate) {
        duplicate = objectManager.add(
          sourceObject.geometry.clone(),
          sourceObject.name
        );

        if (!duplicate) return;

        copyObjectProperties(
          sourceObject,
          duplicate
        );

        duplicate.position.x += 1;
        index = objectManager.getIndex(duplicate);
      } else {
        objectManager.restore(
          duplicate,
          index
        );
      }

      if (onChange) onChange(duplicate);
    }
  };
}

export function createDuplicateObjectsCommand(
  objectManager,
  selectedObjects,
  onChange
) {
  const targets = selectedObjects.filter(
    object => objectManager.getIndex(object) !== -1
  );

  const duplicates = [];

  return {
    undo() {
      const sorted = [...duplicates].sort(
        (a, b) => b.index - a.index
      );

      for (const item of sorted) {
        item.index = objectManager.getIndex(item.object);
        objectManager.detach(item.object);
      }

      if (onChange) onChange(null);
    },

    redo() {
      if (duplicates.length === 0) {
        for (const source of targets) {
          const duplicate = objectManager.add(
            source.geometry.clone(),
            source.name
          );

          if (!duplicate) continue;

          copyObjectProperties(
            source,
            duplicate
          );

          duplicate.position.x += 1;

          duplicates.push({
            object: duplicate,
            index: objectManager.getIndex(duplicate)
          });
        }
      } else {
        const sorted = [...duplicates].sort(
          (a, b) => a.index - b.index
        );

        for (const item of sorted) {
          objectManager.restore(
            item.object,
            item.index
          );
        }
      }

      if (onChange) {
        onChange(duplicates[0]?.object ?? null);
      }
    }
  };
}

export const deleteObjectsTest = true;
