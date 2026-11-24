
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
