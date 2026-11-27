
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
      gap: 10px;
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
      gap: 6px;
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

    @media (max-width: 600px) {
      .mesh-toolbar {
        padding: 9px;
        gap: 8px;
      }

      .mesh-toolbar button {
        flex: 1 1 auto;
        min-width: 70px;
        min-height: 46px;
        font-size: 12px;
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
    {
      callback: () => setMode("vertex")
    }
  );

  modeButtons.edge = createButton(
    sections.modes,
    "━ Edge",
    null,
    {
      callback: () => setMode("edge")
    }
  );

  modeButtons.face = createButton(
    sections.modes,
    "▰ Face",
    null,
    {
      callback: () => setMode("face")
    }
  );

  // 複数選択
  sections.selection = createSection("選択設定");

  const multiButton = createButton(
    sections.selection,
    "複数選択：OFF",
    null,
    {
      callback: () => {
        setMultiSelect(!multiSelect);
      }
    }
  );

  let multiSelect = false;

  // 変形操作
  sections.transform = createSection("変形");

  createButton(sections.transform, "↔ 移動", "move");
  createButton(sections.transform, "⟳ 回転", "rotate");
  createButton(sections.transform, "⤢ 拡大・縮小", "scale");

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

  // 選択・履歴
  sections.utility = createSection("その他");

  createButton(sections.utility, "選択解除", "clear");
  createButton(sections.utility, "↶ 元に戻す", "undo");
  createButton(sections.utility, "↷ やり直す", "redo");

  const divider = document.createElement("div");
  divider.className = "mesh-toolbar-divider";
  root.appendChild(divider);

  // モード切り替え
  sections.modeControl = createSection("編集モード");

  const editModeButton = createButton(
    sections.modeControl,
    "メッシュ編集",
    "editMode",
    { className: "primary" }
  );

  const objectModeButton = createButton(
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
    if (!["vertex", "edge", "face"].includes(mode)) {
      return;
    }

    currentMode = mode;

    for (const [key, button] of Object.entries(modeButtons)) {
      button.classList.toggle("active", key === mode);
      button.setAttribute(
        "aria-pressed",
        String(key === mode)
      );
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
    multiButton.setAttribute(
      "aria-pressed",
      String(multiSelect)
    );

    onMultiSelectChange?.(multiSelect);
  }

  function setEditing(value) {
    editing = Boolean(value);

    editModeButton.classList.toggle("active", editing);

    status.textContent = editing
      ? `${currentMode.toUpperCase()} モードで編集中`
      : "オブジェクトモード";
  }

  setMode("vertex");

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
