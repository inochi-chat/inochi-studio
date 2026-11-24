
export function createNameEditor(object, onChange) {
  const container = document.createElement("div");
  container.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "名前";

  const input = document.createElement("input");
  input.className = "property-name";
  input.value = object.name;

  input.addEventListener("change", () => {
    const newName = input.value.trim();

    if (!newName) {
      input.value = object.name;
      return;
    }

    object.name = newName;

    if (onChange) {
      onChange(object);
    }
  });

  container.append(heading, input);

  return container;
}
