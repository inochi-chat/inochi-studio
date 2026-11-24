
export function createVisibilityButton(
  container,
  object,
  visibility,
  onChange
) {
  if (!container || !object || !visibility) return null;

  const button = document.createElement("button");

  button.className = "visibility-button";

  function update() {
    const visible = visibility.isVisible(object);

    button.textContent = visible
      ? "👁 表示中"
      : "🙈 非表示";

    button.title = visible
      ? "クリックして非表示にする"
      : "クリックして表示する";
  }

  button.addEventListener("click", () => {
    const newVisible = !visibility.isVisible(object);

    if (onChange) {
      onChange(object, newVisible);
    }

    update();
  });

  update();
  container.appendChild(button);

  return {
    element: button,
    update
  };
}
