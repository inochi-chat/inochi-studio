
export function createAddObjectCommand(
  objectManager,
  geometry,
  type,
  onChange
) {
  let object = null;

  return {
    undo() {
      if (!object) return;
      objectManager.detach(object);
      if (onChange) onChange(null);
    },

    redo() {
      if (!object) {
        object = objectManager.add(geometry, type);
      } else {
        objectManager.restore(object);
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
  const index = objectManager.getIndex(object);

  return {
    undo() {
      objectManager.restore(object, index);
      if (onChange) onChange(object);
    },

    redo() {
      objectManager.detach(object);
      if (onChange) onChange(null);
    }
  };
}

// 複数オブジェクト削除コマンド
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
        objectManager.restore(item.object, item.index);
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

// オブジェクト複製コマンド
export function createDuplicateObjectCommand(
  objectManager,
  source,
  onChange
) {
  let duplicate = null;

  return {
    undo() {
      if (!duplicate) return;
      objectManager.detach(duplicate);
      if (onChange) onChange(null);
    },

    redo() {
      if (!duplicate) {
        duplicate = source.clone(true);
        duplicate.geometry = source.geometry.clone();

        if (Array.isArray(source.material)) {
          duplicate.material = source.material.map(
            material => material.clone()
          );
        } else {
          duplicate.material = source.material.clone();
        }

        duplicate.name = `${source.name}_copy`;
        duplicate.position.x += 1;
      }

      objectManager.restore(duplicate);
      if (onChange) onChange(duplicate);
    }
  };
}


// 複数オブジェクト複製コマンド
export function createDuplicateObjectsCommand(
  objectManager,
  sourceObjects,
  onChange
) {
  let duplicates = [];

  function createDuplicates() {
    duplicates = sourceObjects.map(source => {
      const duplicate = source.clone(true);

      duplicate.geometry = source.geometry.clone();

      if (Array.isArray(source.material)) {
        duplicate.material = source.material.map(
          material => material.clone()
        );
      } else {
        duplicate.material = source.material.clone();
      }

      duplicate.name = `${source.name}_copy`;
      duplicate.position.x += 1;

      return duplicate;
    });
  }

  return {
    undo() {
      for (const duplicate of duplicates) {
        objectManager.detach(duplicate);
      }

      if (onChange) onChange(null);
    },

    redo() {
      if (duplicates.length === 0) {
        createDuplicates();
      }

      for (const duplicate of duplicates) {
        objectManager.restore(duplicate);
      }

      if (onChange) {
        onChange(duplicates[0] ?? null);
      }
    }
  };
}


export const deleteObjectsTest = true;
