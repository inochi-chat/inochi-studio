
export function createDuplicateButton({
  button,
  getSelectedObject,
  onDuplicate
}) {
  if (!button) {
    throw new Error("複製ボタンが見つかりません");
  }

  function handleClick() {
    const object = getSelectedObject();

    if (!object) return;

    onDuplicate(object);
  }

  button.addEventListener("click", handleClick);

  return {
    dispose() {
      button.removeEventListener("click", handleClick);
    }
  };
}
