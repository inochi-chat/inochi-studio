
import { createHierarchyDrag } from "./hierarchy-drag.js";

export function createHierarchyView(
  container,
  scene,
  hierarchy,
  onSelect,
  onSetParent,
  onRemoveParent
) {
  const collapsedObjects = new Set();

  const hierarchyDrag = createHierarchyDrag(
    container,
    onSetParent,
    onRemoveParent
  );

  function render(objects, selectedObject) {
    container.innerHTML = "";

    const roots = objects.filter(object =>
      hierarchy.getParent(object) === null &&
      object.parent === scene
    );

    function createItem(object, depth = 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "hierarchy-item";

      const children = hierarchy.getChildren(object);
      const hasChildren = children.length > 0;

      const row = document.createElement("div");
      row.className = "hierarchy-row";

      const toggle = document.createElement("button");
      toggle.className = "hierarchy-toggle";
      toggle.textContent = hasChildren
        ? (collapsedObjects.has(object) ? "▶" : "▼")
        : "";

      toggle.disabled = !hasChildren;

      toggle.addEventListener("click", () => {
        if (collapsedObjects.has(object)) {
          collapsedObjects.delete(object);
        } else {
          collapsedObjects.add(object);
        }

        render(objects, selectedObject);
      });

      const button = document.createElement("button");
      button.className = "object-item";
      button.textContent = object.name || "名称なし";
      button.title = object.name || "名称なし";
      button.style.paddingLeft = `${8 + depth * 16}px`;

      if (object === selectedObject) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        onSelect(object);
      });

      hierarchyDrag.makeDraggable(button, object);

      row.append(toggle, button);
      wrapper.appendChild(row);

      if (hasChildren && !collapsedObjects.has(object)) {
        children.forEach(child => {
          wrapper.appendChild(createItem(child, depth + 1));
        });
      }

      return wrapper;
    }

    roots.forEach(object => {
      container.appendChild(createItem(object));
    });
  }

  return { render };
}
