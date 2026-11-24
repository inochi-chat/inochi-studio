
export function createMultiSelectionMode() {
  let enabled = false;

  function enable() {
    enabled = true;
  }

  function disable() {
    enabled = false;
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  return {
    enable,
    disable,
    toggle,
    isEnabled
  };
}
