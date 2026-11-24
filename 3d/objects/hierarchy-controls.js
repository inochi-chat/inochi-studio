
export function createHierarchyControls(
  container,
  onSetParent,
  onRemoveParent
) {
  const panel = document.createElement("div");
  panel.className = "hierarchy-controls";

  const heading = document.createElement("h3");
  heading.textContent = "親子関係";

  const childLabel = document.createElement("label");
  childLabel.textContent = "子オブジェクト";

  const childSelect = document.createElement("select");

  const parentLabel = document.createElement("label");
  parentLabel.textContent = "親オブジェクト";

  const parentSelect = document.createElement("select");

  const setButton = document.createElement("button");
  setButton.textContent = "親子関係を設定";

  const removeButton = document.createElement("button");
  removeButton.textContent = "親子関係を解除";

  panel.append(
    heading,
    childLabel,
    childSelect,
    parentLabel,
    parentSelect,
    setButton,
    removeButton
  );

  container.innerHTML = "";
  container.appendChild(panel);

  let currentObjects = [];

  function findObject(uuid) {
    return currentObjects.find(object => object.uuid === uuid);
  }

  function update(objects, selectedObject, hierarchy) {
    currentObjects = objects;

    childSelect.innerHTML = "";
    parentSelect.innerHTML = "";

    objects.forEach(object => {
      const childOption = document.createElement("option");
      childOption.value = object.uuid;
      childOption.textContent = object.name;
      childSelect.appendChild(childOption);

      const parentOption = document.createElement("option");
      parentOption.value = object.uuid;
      parentOption.textContent = object.name;
      parentSelect.appendChild(parentOption);
    });

    if (selectedObject) {
      childSelect.value = selectedObject.uuid;

      const currentParent = hierarchy.getParent(selectedObject);

      if (currentParent) {
        parentSelect.value = currentParent.uuid;
      }
    }
  }

  setButton.addEventListener("click", () => {
    const child = findObject(childSelect.value);
    const parent = findObject(parentSelect.value);

    if (!child || !parent) return;

    onSetParent(child, parent);
  });

  removeButton.addEventListener("click", () => {
    const child = findObject(childSelect.value);

    if (!child) return;

    onRemoveParent(child);
  });

  return { update };
}
