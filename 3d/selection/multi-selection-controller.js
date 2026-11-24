
export function createMultiSelectionController({
  multiSelection,
  visual,
  objectManager,
  objectLock,
  onChange
}) {
  function select(object, additive = false) {
    if (object && objectLock?.isLocked(object)) {
      return;
    }

    if (!additive) {
      multiSelection.clear();
      visual.clear();
    }

    if (!object) {
      if (onChange) onChange(multiSelection.getAll());
      return;
    }

    if (multiSelection.has(object)) {
      if (additive) {
        multiSelection.remove(object);
        visual.remove(object);
      }
    } else {
      multiSelection.add(object);
      visual.add(object);
    }

    if (onChange) onChange(multiSelection.getAll());
  }

  function toggle(object) {
    if (!object || objectLock?.isLocked(object)) return;

    multiSelection.toggle(object);

    if (multiSelection.has(object)) {
      visual.add(object);
    } else {
      visual.remove(object);
    }

    if (onChange) onChange(multiSelection.getAll());
  }

  function clear() {
    multiSelection.clear();
    visual.clear();

    if (onChange) onChange([]);
  }

  function getSelected() {
    return multiSelection.getAll();
  }

  return {
    select,
    toggle,
    clear,
    getSelected
  };
}
