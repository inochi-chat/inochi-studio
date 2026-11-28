
export function createSelectionActions({
  objectManager,
  objectGroup,
  multiSelectionController,
  transform,
  isMeshEditing,
  isObjectEffectivelyLocked,
  refreshEditorUI,
  refreshProperties,
  setActiveGroup
}) {
  function selectPrimaryObject(object, selectedObjects = null) {
    if (isMeshEditing()) return;

    setActiveGroup(null);

    if (object && isObjectEffectivelyLocked(object)) {
      object = null;
      selectedObjects = [];
    }

    objectManager.select(object);

    const selectedObject = objectManager.getSelected();

    if (selectedObjects && selectedObjects.length > 1) {
      transform.attachMultiple(selectedObjects);
    } else if (selectedObject) {
      transform.attach(selectedObject);
    } else {
      transform.detach();
    }

    refreshEditorUI();
    refreshProperties();
  }

  function selectObject(object) {
    if (isMeshEditing()) return;

    if (object && isObjectEffectivelyLocked(object)) {
      alert("ロック中のオブジェクトは選択・編集できません。");
      return;
    }

    setActiveGroup(null);
    multiSelectionController.select(object, false);
  }

  function selectGroup(group) {
    if (isMeshEditing()) return;
    if (!group || !objectGroup.isGroup(group)) return;

    multiSelectionController.clear();
    setActiveGroup(group);
    objectManager.select(null);
    transform.attach(group);

    refreshEditorUI();
    refreshProperties();
  }

  return {
    selectPrimaryObject,
    selectObject,
    selectGroup
  };
}
