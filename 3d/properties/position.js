
import * as THREE from "three";

export function createPositionEditor(object, onChange) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "位置";

  group.appendChild(heading);

  ["X", "Y", "Z"].forEach((axis, index) => {
    const key = axis.toLowerCase();

    const row = document.createElement("div");
    row.className = "property-row";

    const label = document.createElement("label");
    label.textContent = axis;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.value = Number(object.position[key].toFixed(2));

    input.addEventListener("change", () => {
      const value = Number(input.value);

      if (!Number.isFinite(value)) return;

      object.position.setComponent(index, value);

      if (onChange) {
        onChange(object);
      }
    });

    row.append(label, input);
    group.appendChild(row);
  });

  return group;
}
