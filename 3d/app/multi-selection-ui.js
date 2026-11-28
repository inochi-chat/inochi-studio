
export function createMultiSelectionUI({
  button,
  mode,
  multiSelection,
  multiSelectionController,
  isEditing
}) {
  function update() {
    if (!button) return;

    const enabled = mode.isEnabled();

    button.textContent = enabled
      ? "☑ 複数選択：ON"
      : "☐ 複数選択：OFF";

    button.classList.toggle("active", enabled);
  }

  button?.addEventListener("click", () => {
    if (isEditing()) return;

    const enabled = mode.toggle();

    if (!enabled) {
      const selectedObjects = multiSelection.getAll();

      multiSelectionController.select(
        selectedObjects[0] ?? null,
        false
      );
    }

    update();
  });

  update();

  return {
    update
  };
}
