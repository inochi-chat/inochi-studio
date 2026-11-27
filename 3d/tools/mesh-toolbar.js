
export function createMeshToolbar({
  container,
  onModeChange,
  onMultiSelectChange,
  onAction
}) {
  if (!container) {
    throw new Error("Mesh toolbar container not found");
  }

  const style = document.createElement("style");

  style.textContent = `
    .mesh-toolbar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      padding: 12px;
      box-sizing: border-box;
      background: #20232b;
      color: #f4f5f7;
      border: 1px solid #414653;
      border-radius: 12px;
      font-family: sans-serif;
    }

    .mesh-toolbar-section {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .mesh-toolbar-title {
      font-size: 12px;
      font-weight: bold;
      color: #aeb7c8;
      letter-spacing: .05em;
    }

    .mesh-toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .mesh-toolbar button {
      min-height: 44px;
      min-width: 58px;
      padding: 9px 12px;
      border: 1px solid #50596b;
      border-radius: 8px;
      background: #303642;
      color: #f4f5f7;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
    }

    .mesh-toolbar button:active {
      transform: scale(.97);
    }

    .mesh-toolbar button.active {
      background: #2866d8;
      border-color: #78a6ff;
      color: white;
    }

    .mesh-toolbar button:disabled {
      opacity: .35;
      cursor: not-allowed;
    }

    .mesh-toolbar button.danger {
      background: #592f38;
      border-color: #9b4d5c;
    }

    .mesh-toolbar button.primary {
      background: #245b9e;
      border-color: #548bd0;
    }

    .mesh-toolbar-divider {
      height: 1px;
      background: #414653;
      width: 100%;
    }

    .mesh-toolbar-status {
      font-size: 12px;
      color: #aeb7c8;
    }

    .mesh-transform-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 11px;
      border: 1px solid #414b5c;
      border-radius: 10px;
      background: #191d25;
    }

    .mesh-transform-tabs {
      display: flex;
      gap: 6px;
    }

    .mesh-transform-tabs button {
      flex: 1;
      min-width: 0;
    }

    .mesh-transform-fields {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .mesh-transform-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    .mesh-transform-field label {
      font-size: 12px;
      font-weight: bold;
      color: #aeb7c8;
    }

    .mesh-transform-field input {
      width: 100%;
      min-width: 0;
      height: 44px;
      box-sizing: border-box;
      padding: 7px;
      border: 1px solid #50596b;
      border-radius: 7px;
      background: #303642;
      color: white;
      font-size: 16px;
    }

    .mesh-transform-apply {
      width: 100%;
      background: #245b9e !important;
      border-color: #548bd0 !important;
    }

    .mesh-transform-hint {
      font-size: 11px;
      color: #8995a8;
      line-height: 1.5;
    }

    @media (max-width: 600px) {
      .mesh-toolbar {
        padding: 9px;
        gap: 9px;
      }

      .mesh-toolbar button {
        flex: 1 1 auto;
        min-width: 70px;
        min-height: 46px;
        font-size: 12px;
      }

      .mesh-transform-fields {
        gap: 6px;
      }

      .mesh-transform-field input {
        font-size: 16px;
      }
    }
  `;

  document.head.appendChild(style);

  const root = document.createElement("div");
  root.className = "mesh-toolbar";

  const sections = {};

  function createSection(title) {
    const section = document.createElement("div");
    section.className = "mesh-toolbar-section";

    const heading = document.createElement("div");
    heading.className = "mesh-toolbar-title";
    heading.textContent = title;

    const row = document.createElement("div");
    row.className = "mesh-toolbar-row";

    section.append(heading, row);
    root.appendChild(section);

    return row;
  }

  function createButton(parent, label, action, options = {}) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.title = options.title || label;

    if (options.className) {
      button.classList.add(options.className);
    }

    if (options.disabled) {
      button.disabled = true;
    }

    button.addEventListener("click", () => {
      if (button.disabled) return;

      if (options.callback) {
        options.callback();
      } else {
        onAction?.(action);
      }
    });

    parent.appendChild(button);

    return button;
  }

  // 選択モード
  sections.modes = createSection("選択モード");

  const modeButtons = {};

  modeButtons.vertex = createButton(
    sections.modes,
    "◆ Vertex",
    null,
    { callback: () => setMode("vertex") }
  );

  modeButtons.edge = createButton(
    sections.modes,
    "━ Edge",
    null,
    { callback: () => setMode("edge") }
  );

  modeButtons.face = createButton(
    sections.modes,
    "▰ Face",
    null,
    { callback: () => setMode("face") }
  );

  // 複数選択
  sections.selection = createSection("選択設定");

  let multiSelect = false;

  const multiButton = createButton(
    sections.selection,
    "複数選択：OFF",
    null,
    {
      callback: () => setMultiSelect(!multiSelect)
    }
  );

  // 変形
  sections.transform = createSection("変形");

  const transformButtons = {};

  transformButtons.move = createButton(
    sections.transform,
    "↔ 移動",
    null,
    {
      callback: () => setTransformMode("move")
    }
  );

  transformButtons.rotate = createButton(
    sections.transform,
    "⟳ 回転",
    null,
    {
      callback: () => setTransformMode("rotate")
    }
  );

  transformButtons.scale = createButton(
    sections.transform,
    "⤢ 拡大・縮小",
    null,
    {
      callback: () => setTransformMode("scale")
    }
  );

  // 数値入力パネル
  const transformPanel = document.createElement("div");
  transformPanel.className = "mesh-transform-panel";

  const transformHeading = document.createElement("div");
  transformHeading.className = "mesh-toolbar-title";
  transformHeading.textContent = "変形数値";

  const transformFields = document.createElement("div");
  transformFields.className = "mesh-transform-fields";

  const inputs = {};

  for (const axis of ["X", "Y", "Z"]) {
    const field = document.createElement("div");
    field.className = "mesh-transform-field";

    const label = document.createElement("label");
    label.textContent = axis;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.inputMode = "decimal";
    input.value = axis === "Z" ? "0" : "0";

    label.htmlFor = `mesh-transform-${axis.toLowerCase()}`;

    input.id = `mesh-transform-${axis.toLowerCase()}`;

    field.append(label, input);
    transformFields.appendChild(field);

    inputs[axis.toLowerCase()] = input;
  }

  const applyButton = createButton(
    transformPanel,
    "変形を適用",
    null,
    {
      className: "mesh-transform-apply",
      callback: applyTransform
    }
  );

  const hint = document.createElement("div");
  hint.className = "mesh-transform-hint";
  hint.textContent =
    "X・Y・Z の値を入力して適用。移動は距離、回転は度数、拡大縮小は倍率。";

  transformPanel.append(
    transformHeading,
    transformFields,
    applyButton,
    hint
  );

  root.appendChild(transformPanel);

  let transformMode = "move";

  function setTransformMode(mode) {
    if (!["move", "rotate", "scale"].includes(mode)) return;

    transformMode = mode;

    for (const [key, button] of Object.entries(transformButtons)) {
      button.classList.toggle("active", key === mode);
    }

    transformHeading.textContent =
      mode === "move"
        ? "移動量"
        : mode === "rotate"
          ? "回転角度（度）"
          : "拡大・縮小倍率";

    if (mode === "move") {
      inputs.x.value = "0";
      inputs.y.value = "0.2";
      inputs.z.value = "0";
    } else if (mode === "rotate") {
      inputs.x.value = "0";
      inputs.y.value = "0";
      inputs.z.value = "15";
    } else {
      inputs.x.value = "1.2";
      inputs.y.value = "1.2";
      inputs.z.value = "1.2";
    }
  }

  function applyTransform() {
    const values = [
      Number(inputs.x.value),
      Number(inputs.y.value),
      Number(inputs.z.value)
    ];

    if (values.some(value => !Number.isFinite(value))) {
      status.textContent = "正しい数値を入力してください";
      return;
    }

    onAction?.(`transform:${transformMode}:${values.join(",")}`);
  }

  // メッシュ編集
  sections.edit = createSection("メッシュ編集");

  createButton(
    sections.edit,
    "✂ 分割",
    "subdivide",
    { className: "primary" }
  );

  createButton(
    sections.edit,
    "⬆ 押し出し",
    "extrude",
    { className: "primary" }
  );

  createButton(
    sections.edit,
    "＋ 頂点追加",
    "addVertex",
    { disabled: true }
  );

  createButton(
    sections.edit,
    "⌫ 削除",
    "delete",
    { className: "danger" }
  );

  // その他
  sections.utility = createSection("その他");

  createButton(sections.utility, "選択解除", "clear");
  createButton(sections.utility, "↶ 元に戻す", "undo");
  createButton(sections.utility, "↷ やり直す", "redo");

  const divider = document.createElement("div");
  divider.className = "mesh-toolbar-divider";
  root.appendChild(divider);

  // 編集モード
  sections.modeControl = createSection("編集モード");

  createButton(
    sections.modeControl,
    "メッシュ編集",
    "editMode",
    { className: "primary" }
  );

  createButton(
    sections.modeControl,
    "オブジェクトモードに戻る",
    "objectMode"
  );

  const status = document.createElement("div");
  status.className = "mesh-toolbar-status";
  status.textContent = "Vertex / Edge / Face から選択してね";
  root.appendChild(status);

  container.replaceChildren(root);

  let currentMode = "vertex";
  let editing = true;

  function setMode(mode) {
    if (!["vertex", "edge", "face"].includes(mode)) return;

    currentMode = mode;

    for (const [key, button] of Object.entries(modeButtons)) {
      button.classList.toggle("active", key === mode);
      button.setAttribute("aria-pressed", String(key === mode));
    }

    status.textContent = `${mode.toUpperCase()} モード`;

    onModeChange?.(mode);
  }

  function setMultiSelect(value) {
    multiSelect = Boolean(value);

    multiButton.textContent = multiSelect
      ? "複数選択：ON"
      : "複数選択：OFF";

    multiButton.classList.toggle("active", multiSelect);
    multiButton.setAttribute("aria-pressed", String(multiSelect));

    onMultiSelectChange?.(multiSelect);
  }

  function setEditing(value) {
    editing = Boolean(value);

    transformPanel.hidden = !editing;
    editModeButton?.classList?.toggle("active", editing);

    status.textContent = editing
      ? `${currentMode.toUpperCase()} モードで編集中`
      : "オブジェクトモード";
  }

  setMode("vertex");
  setTransformMode("move");

  return {
    element: root,
    setMode,
    setMultiSelect,
    setEditing,

    dispose() {
      root.remove();
      style.remove();
    }
  };
}
