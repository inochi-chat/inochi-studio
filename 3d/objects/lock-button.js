
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
    const newLocked = !objectLock.isLocked(object);

    if (onChange) {
      onChange(object, newLocked);
    } else {
      if (newLocked) {
        objectLock.lock(object);
      } else {
        objectLock.unlock(object);
      }
    }

    update();
  });

  update();
  container.appendChild(button);

  return { element: button, update };
}
