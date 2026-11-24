
import * as THREE from "three";

export function createRotationEditor(object, onChange) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "回転（度）";

  group.appendChild(heading);

  ["X", "Y", "Z"].forEach((axis, index) => {
    const key = axis.toLowerCase();

    const row = document.createElement("div");
    row.className = "property-row";

    const label = document.createElement("label");
    label.textContent = axis;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "1";
    input.value = Number(
      THREE.MathUtils.radToDeg(object.rotation[key]).toFixed(2)
    );

    input.addEventListener("change", () => {
      const value = Number(input.value);

      if (!Number.isFinite(value)) return;

      const radians = THREE.MathUtils.degToRad(value);

      object.rotation.setComponent(index, radians);

      if (onChange) {
        onChange(object);
      }
    });

    row.append(label, input);
    group.appendChild(row);
  });

  return group;
}
