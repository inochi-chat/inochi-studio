
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
    visibility.toggle(object);
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
