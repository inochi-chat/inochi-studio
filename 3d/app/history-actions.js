
export function createHistoryActions({
  history,
  isMeshEditing,
  getMeshHistory,
  setActiveGroup,
  selectObject
}) {
  function undo() {
    if (isMeshEditing()) {
      getMeshHistory()?.undo();
      return;
    }

    history.undo();
  }

  function redo() {
    if (isMeshEditing()) {
      getMeshHistory()?.redo();
      return;
    }

    history.redo();
  }

  function onHistoryChange(object) {
    if (isMeshEditing()) return;

    setActiveGroup(null);
    selectObject(object);
  }

  return {
    undo,
    redo,
    onHistoryChange
  };
}
