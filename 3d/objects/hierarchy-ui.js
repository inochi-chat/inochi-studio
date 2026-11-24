
import { createHierarchyView } from "./hierarchy-view.js";
import { createHierarchyControls } from "./hierarchy-controls.js";

export function createHierarchyUI({
  listContainer,
  controlsContainer,
  scene,
  hierarchy,
  onSelect,
  onSetParent,
  onRemoveParent
}) {
  const hierarchyView = createHierarchyView(
    listContainer,
    scene,
    hierarchy,
    onSelect,
    onSetParent,
    onRemoveParent
  );

  const hierarchyControls = createHierarchyControls(
    controlsContainer,
    onSetParent,
    onRemoveParent
  );

  function update(objects, selectedObject) {
    hierarchyView.render(objects, selectedObject);

    hierarchyControls.update(
      objects,
      selectedObject,
      hierarchy
    );
  }

  return { update };
}
