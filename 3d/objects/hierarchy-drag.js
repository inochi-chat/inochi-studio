
export function createHierarchyDrag(onSetParent, onRemoveParent) {
  let draggedObject = null;

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
      event.stopPropagation();

      if (!draggedObject || draggedObject === object) return;

      onSetParent(draggedObject, object);
      draggedObject = null;
    });
  }

  function enableRootDrop(container) {
    container.addEventListener("dragover", event => {
      if (!draggedObject) return;

      if (event.target.closest(".hierarchy-row")) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    container.addEventListener("drop", event => {
      if (!draggedObject) return;

      if (event.target.closest(".hierarchy-row")) return;

      event.preventDefault();

      onRemoveParent(draggedObject);
      draggedObject = null;
    });
  }

  enableRootDrop(container);

  return { makeDraggable };
}
