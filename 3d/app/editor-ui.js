
export function createEditorUI({
  objectManager,
  getSelectedObject,
  objectListView,
  hierarchyUI
}) {
  function updateObjectList() {
    objectListView.render(
      objectManager.getAll(),
      getSelectedObject()
    );
  }

  function updateHierarchy() {
    hierarchyUI.update(
      objectManager.getAll(),
      getSelectedObject()
    );
  }

  function refreshEditorUI() {
    updateObjectList();
    updateHierarchy();
  }

  return {
    updateObjectList,
    updateHierarchy,
    refreshEditorUI
  };
}
