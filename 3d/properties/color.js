
export function createColorEditor(object, onChange) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "マテリアル";
  group.appendChild(heading);

  const material = object.material;

  if (!material || Array.isArray(material)) {
    const message = document.createElement("p");
    message.textContent = "このマテリアルは編集できません。";
    group.appendChild(message);
    return group;
  }

  function notifyChange() {
    material.needsUpdate = true;

    if (onChange) {
      onChange(object);
    }
  }

  function createSlider(labelText, min, max, step, initialValue, onInput) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "14px";

    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.justifyContent = "space-between";
    label.style.marginBottom = "6px";
    label.style.fontSize = "14px";

    const name = document.createElement("span");
    name.textContent = labelText;

    const valueText = document.createElement("span");
    valueText.textContent = Number(initialValue).toFixed(2);

    label.append(name, valueText);

    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = initialValue;
    input.style.width = "100%";
    input.style.minHeight = "32px";

    input.addEventListener("input", () => {
      const value = Number(input.value);
      valueText.textContent = value.toFixed(2);
      onInput(value);
      notifyChange();
    });

    wrapper.append(label, input);
    group.appendChild(wrapper);
  }

  // カラー
  const colorHeading = document.createElement("h4");
  colorHeading.textContent = "カラー";
  group.appendChild(colorHeading);

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = "#" + material.color.getHexString();
  colorInput.style.width = "100%";
  colorInput.style.minHeight = "44px";

  colorInput.addEventListener("input", () => {
    material.color.set(colorInput.value);
    notifyChange();
  });

  group.appendChild(colorInput);

  // メタリック
  createSlider(
    "メタリック",
    0,
    1,
    0.01,
    material.metalness ?? 0,
    value => {
      material.metalness = value;
    }
  );

  // 粗さ
  createSlider(
    "粗さ",
    0,
    1,
    0.01,
    material.roughness ?? 0.5,
    value => {
      material.roughness = value;
    }
  );

  // 透明度
  createSlider(
    "透明度",
    0,
    1,
    0.01,
    material.opacity ?? 1,
    value => {
      material.opacity = value;
      material.transparent = value < 1;
    }
  );

  return group;
}
