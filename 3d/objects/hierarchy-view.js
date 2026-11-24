
export function createHierarchyView(container, scene, hierarchy, onSelect) {
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

      const button = document.createElement("button");
      button.className = "object-item";

      button.textContent =
        (children.length > 0 ? "📂 " : "📦 ") + object.name;

      button.style.paddingLeft = `${12 + depth * 18}px`;

      if (object === selectedObject) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        onSelect(object);
      });

      wrapper.appendChild(button);

      children.forEach(child => {
        wrapper.appendChild(createItem(child, depth + 1));
      });

      return wrapper;
    }

    roots.forEach(object => {
      container.appendChild(createItem(object));
    });
  }

  return { render };
}
