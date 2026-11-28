
export function createColorEditor(object, onMaterialChange) {
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

  function getState() {
    return {
      color: material.color.getHex(),
      metalness: material.metalness ?? 0,
      roughness: material.roughness ?? 0.5,
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false
    };
  }

  function commit(before) {
    const after = getState();

    if (JSON.stringify(before) === JSON.stringify(after)) {
      return;
    }

    onMaterialChange?.(object, before, after);
  }

  function createSlider(labelText, initialValue, onInput) {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "14px";

    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.justifyContent = "space-between";
    label.style.marginBottom = "6px";

    const name = document.createElement("span");
    name.textContent = labelText;

    const valueText = document.createElement("span");
    valueText.textContent = Number(initialValue).toFixed(2);

    label.append(name, valueText);

    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "1";
    input.step = "0.01";
    input.value = initialValue;
    input.style.width = "100%";
    input.style.minHeight = "36px";
    input.style.touchAction = "pan-y";

    let before = null;

    input.addEventListener("pointerdown", () => {
      before = getState();
    });

    input.addEventListener("input", () => {
      const value = Number(input.value);
      valueText.textContent = value.toFixed(2);
      onInput(value);
      material.needsUpdate = true;
    });

    input.addEventListener("change", () => {
      if (!before) return;

      commit(before);
      before = null;
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

  let colorBefore = null;

  colorInput.addEventListener("pointerdown", () => {
    colorBefore = getState();
  });

  colorInput.addEventListener("input", () => {
    material.color.set(colorInput.value);
  });

  colorInput.addEventListener("change", () => {
    const before = colorBefore || getState();
    commit(before);
    colorBefore = null;
  });

  group.appendChild(colorInput);

  // メタリック
  createSlider("メタリック", material.metalness ?? 0, value => {
    material.metalness = value;
  });

  // 粗さ
  createSlider("粗さ", material.roughness ?? 0.5, value => {
    material.roughness = value;
  });

  // 透明度
  createSlider("透明度", material.opacity ?? 1, value => {
    material.opacity = value;
    material.transparent = value < 1;
  });

  return group;
}
