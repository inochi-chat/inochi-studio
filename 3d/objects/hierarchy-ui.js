
import { createHierarchyView } from "./hierarchy-view.js";
import { createHierarchyControls } from "./hierarchy-controls.js";

export function createHierarchyUI({
  listContainer,
  controlsContainer,
  scene,
  onSelect,
  onSetParent,
  onRemoveParent
}) {
  const hierarchyView = createHierarchyView(
    listContainer,
    scene,
    onSelect
  );

  const hierarchyControls = createHierarchyControls(
    controlsContainer,
    onSetParent,
    onRemoveParent
  );

  function update(objects, selectedObject, hierarchy) {
    hierarchyView.render(objects, selectedObject);

    hierarchyControls.update(
      objects,
      selectedObject,
      hierarchy
    );
  }

  return {
    update
  };
}
