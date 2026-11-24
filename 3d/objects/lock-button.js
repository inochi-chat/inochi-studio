
export function createLockButton(
  container,
  object,
  objectLock,
  onChange
) {
  if (!container || !object || !objectLock) return null;

  const button = document.createElement("button");

  button.className = "lock-button";

  function update() {
    const locked = objectLock.isLocked(object);

    button.textContent = locked ? "🔒" : "🔓";

    button.title = locked
      ? "クリックしてロック解除"
      : "クリックしてロック";
  }

  button.addEventListener("click", () => {
    objectLock.toggle(object);
    update();

    if (onChange) {
      onChange(object);
    }
  });

  update();
  container.appendChild(button);

  return {
    element: button,
    update
  };
}
