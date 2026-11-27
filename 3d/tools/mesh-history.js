
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
    const geometry = mesh.geometry;
    const position = geometry.attributes.position;

    return {
      positions: Array.from(position.array),
      index: geometry.index
        ? Array.from(geometry.index.array)
        : null
    };
  }

  function restore(state) {
    if (!state?.positions) return false;

    const geometry = mesh.geometry;

    const position = geometry.attributes.position;

    if (!position || position.array.length !== state.positions.length) {
      const replacement = new THREE.BufferGeometry();

      replacement.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          state.positions,
          3
        )
      );

      if (state.index) {
        replacement.setIndex(state.index);
      }

      replacement.computeVertexNormals();
      replacement.computeBoundingBox();
      replacement.computeBoundingSphere();

      mesh.geometry.dispose();
      mesh.geometry = replacement;
    } else {
      for (let i = 0; i < state.positions.length; i++) {
        position.array[i] = state.positions[i];
      }

      position.needsUpdate = true;

      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }

    onRestore();

    return true;
  }

  function save() {
    undoStack.push(capture());

    if (undoStack.length > maxHistory) {
      undoStack.shift();
    }

    redoStack.length = 0;
  }

  function undo() {
    if (undoStack.length === 0) return false;

    redoStack.push(capture());

    const previous = undoStack.pop();

    return restore(previous);
  }

  function redo() {
    if (redoStack.length === 0) return false;

    undoStack.push(capture());

    const next = redoStack.pop();

    return restore(next);
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  function canUndo() {
    return undoStack.length > 0;
  }

  function canRedo() {
    return redoStack.length > 0;
  }

  return {
    save,
    undo,
    redo,
    clear,
    canUndo,
    canRedo
  };
}
