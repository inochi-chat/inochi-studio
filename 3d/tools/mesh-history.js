
export function createMeshHistory({
  mesh,
  maxHistory = 50,
  onRestore = () => {}
}) {
  if (!mesh?.isMesh) {
    throw new Error("履歴を管理するメッシュが必要です。");
  }

  const undoStack = [];
  const redoStack = [];

  function capture() {
    return mesh.geometry.clone();
  }

  function clearStack(stack) {
    for (const geometry of stack) {
      geometry.dispose();
    }

    stack.length = 0;
  }

  function push(stack, geometry) {
    stack.push(geometry);

    while (stack.length > maxHistory) {
      const oldest = stack.shift();
      oldest.dispose();
    }
  }

  function save() {
    push(undoStack, capture());
    clearStack(redoStack);
  }

  function restore(stack, oppositeStack) {
    if (stack.length === 0) return false;

    push(oppositeStack, capture());

    const previous = mesh.geometry;
    const snapshot = stack.pop();

    mesh.geometry = snapshot;
    previous.dispose();

    onRestore(mesh.geometry);

    return true;
  }

  function undo() {
    return restore(undoStack, redoStack);
  }

  function redo() {
    return restore(redoStack, undoStack);
  }

  function clear() {
    clearStack(undoStack);
    clearStack(redoStack);
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  function dispose() {
    clear();
  }

  return {
    save,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    dispose
  };
}
