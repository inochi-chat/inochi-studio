
export function createHierarchyView(
  container,
  scene,
  onSelect
) {
  function render(objects, selectedObject) {
    container.innerHTML = "";

    // シーン直下のオブジェクトを取得
    const roots = objects.filter(
      object => object.parent === scene
    );

    function createItem(object, depth = 0) {
      const wrapper = document.createElement("div");
      wrapper.className = "hierarchy-item";

      const button = document.createElement("button");
      button.className = "object-item";

      const childCount = object.children.length;
      const prefix = childCount > 0 ? "📂 " : "📦 ";

      button.textContent = prefix + object.name;
      button.style.paddingLeft = `${12 + depth * 18}px`;

      if (object === selectedObject) {
        button.classList.add("selected");
      }

      button.addEventListener("click", () => {
        onSelect(object);
      });

      wrapper.appendChild(button);

      // 子オブジェクトを再帰的に表示
      object.children.forEach(child => {
        if (objects.includes(child)) {
          wrapper.appendChild(
            createItem(child, depth + 1)
          );
        }
      });

      return wrapper;
    }

    roots.forEach(object => {
      container.appendChild(createItem(object));
    });
  }

  return {
    render
  };
}
