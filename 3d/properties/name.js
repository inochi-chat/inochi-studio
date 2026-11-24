
export function createNameEditor(object, onChange) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "名前";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "property-name";
  input.value = object.name;

  input.addEventListener("input", () => {
    object.name = input.value;

    if (onChange) {
      onChange(object);
    }
  });

  group.appendChild(heading);
  group.appendChild(input);

  return group;
}
