
export function createHierarchyDrag(
  container,
  onSetParent,
  onRemoveParent,
  onMove
) {
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

      container.querySelectorAll(".hierarchy-drop-before, .hierarchy-drop-after")
        .forEach(element => {
          element.classList.remove(
            "hierarchy-drop-before",
            "hierarchy-drop-after"
          );
        });
    });

    button.addEventListener("dragover", event => {
      if (!draggedObject || draggedObject === object) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";

      const rect = button.getBoundingClientRect();
      const position = event.clientY < rect.top + rect.height / 2
        ? "before"
        : "after";

      button.classList.toggle("hierarchy-drop-before", position === "before");
      button.classList.toggle("hierarchy-drop-after", position === "after");
    });

    button.addEventListener("dragleave", () => {
      button.classList.remove(
        "hierarchy-drop-before",
        "hierarchy-drop-after"
      );
    });

    button.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();

      button.classList.remove(
        "hierarchy-drop-before",
        "hierarchy-drop-after"
      );

      if (!draggedObject || draggedObject === object) return;

      const source = draggedObject;
      draggedObject = null;

      if (source.parent === object.parent) {
        const rect = button.getBoundingClientRect();
        const position = event.clientY < rect.top + rect.height / 2
          ? "before"
          : "after";

        if (onMove) {
          onMove(source, object, position);
        }
      } else {
        onSetParent(source, object);
      }
    });
  }

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

    const object = draggedObject;
    draggedObject = null;

    onRemoveParent(object);
  });

  return { makeDraggable };
}
