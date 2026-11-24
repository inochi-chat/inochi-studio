
export function createColorEditor(object, onChange) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "カラー";

  group.appendChild(heading);

  const input = document.createElement("input");
  input.type = "color";
  input.value = "#" + object.material.color.getHexString();

  input.addEventListener("input", () => {
    object.material.color.set(input.value);

    if (onChange) {
      onChange(object);
    }
  });

  group.appendChild(input);

  return group;
}
