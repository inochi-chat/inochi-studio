
export function createObjectVisibility() {
  function toggle(object) {
    if (!object) return false;

    object.visible = !object.visible;

    return object.visible;
  }

  function setVisible(object, visible) {
    if (!object) return false;

    object.visible = Boolean(visible);

    return object.visible;
  }

  function isVisible(object) {
    if (!object) return false;

    return object.visible;
  }

  return {
    toggle,
    setVisible,
    isVisible
  };
}
