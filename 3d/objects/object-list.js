
export function createObjectList(container, onSelect) {
  function render(objects, selectedObject) {
    container.innerHTML = "";

    objects.forEach((object) => {
      const item = document.createElement("button");

      item.className = "object-item";
      item.textContent = object.name;

      if (object === selectedObject) {
        item.classList.add("selected");
      }

      item.addEventListener("click", () => {
        onSelect(object);
      });

      container.appendChild(item);
    });
  }

  return {
    render
  };
}
