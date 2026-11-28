
export function createKeyboardShortcuts({
  undo,
  redo
}) {
  function handleKeydown(event) {
    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    ) {
      return;
    }

    if (!(event.ctrlKey || event.metaKey)) return;

    if (event.key.toLowerCase() === "z") {
      event.preventDefault();

      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }

    if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
    }
  }

  document.addEventListener("keydown", handleKeydown);

  return {
    handleKeydown
  };
}
