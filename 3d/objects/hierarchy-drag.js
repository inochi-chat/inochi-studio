
export function createHierarchyDrag(onSetParent) {
  let draggedObject = null;

  function getObjectFromElement(element) {
    return element.closest("[data-object-uuid]");
  }

  function makeDraggable(button, object) {
    button.draggable = true;
    button.dataset.objectUuid = object.uuid;

    button.addEventListener("dragstart", event => {
      draggedObject = object;

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", object.uuid);

      button.classList.add("hierarchy-dragging");
    });

    button.addEventListener("dragend", () => {
      draggedObject = null;
      button.classList.remove("hierarchy-dragging");
    });

    button.addEventListener("dragover", event => {
      if (!draggedObject || draggedObject === object) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    button.addEventListener("drop", event => {
      event.preventDefault();

      if (!draggedObject || draggedObject === object) return;

      onSetParent(draggedObject, object);
      draggedObject = null;
    });
  }

  return { makeDraggable };
}
