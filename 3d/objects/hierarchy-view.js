
export function createHierarchyView(container, scene, hierarchy, onSelect) {
  const collapsedObjects = new Set();

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
        : " ";

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
      button.textContent =
        (hasChildren ? "📂 " : "📦 ") + object.name;

      button.style.paddingLeft = `${8 + depth * 18}px`;

      if (object === selectedObject) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        onSelect(object);
      });

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
