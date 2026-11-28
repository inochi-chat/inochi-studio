
export function createMeshToolbar({
  container,
  onModeChange,
  onMultiSelectChange,
  onAction,
  onGizmoVisibilityChange,
  onMirrorChange
}) {
  if (!container) {
    throw new Error("Mesh toolbar container not found");
  }

  const style = document.createElement("style");

  style.textContent = `
    .mesh-toolbar-root {
      position: absolute;
      z-index: 1000;
      top: 12px;
      right: 12px;
      font-family: sans-serif;
    }

    .mesh-toolbar-toggle {
      width: 48px;
      height: 48px;
      min-height: 48px;
      padding: 0;
      margin: 0;
      border: 1px solid #7964a8;
      border-radius: 12px;
      background: #30284c;
      color: white;
      font-size: 25px;
      font-weight: bold;
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      touch-action: manipulation;
    }

    .mesh-toolbar {
      position: absolute;
      top: 56px;
      right: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 245px;
      min-width: 190px;
      max-width: calc(100vw - 24px);
      max-height: 48dvh;
      min-height: 160px;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
      padding: 7px 7px 32px;
      background: rgba(32, 35, 43, .82);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #f4f5f7;
      border: 1px solid rgba(120, 130, 150, .55);
      border-radius: 12px;
      box-shadow: 0 6px 22px rgba(0,0,0,.38);
    }

    .mesh-toolbar[hidden] {
      display: none !important;
    }

    .mesh-toolbar-section {
      border: 1px solid rgba(90, 100, 120, .65);
      border-radius: 9px;
      overflow: hidden;
      background: rgba(25, 29, 37, .72);
      flex-shrink: 0;
    }

    .mesh-toolbar-heading {
      width: 100%;
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      margin: 0;
      border: 0;
      background: rgba(48, 54, 66, .85);
      color: white;
      font-size: 12px;
      font-weight: bold;
      text-align: left;
      touch-action: manipulation;
    }

    .mesh-toolbar-arrow {
      color: #aeb7c8;
      font-size: 16px;
    }

    .mesh-toolbar-section.open .mesh-toolbar-arrow {
      transform: rotate(90deg);
    }

    .mesh-toolbar-content {
      display: none;
      flex-direction: column;
      gap: 6px;
      padding: 7px;
    }

    .mesh-toolbar-section.open .mesh-toolbar-content {
      display: flex;
    }

    .mesh-toolbar button:not(.mesh-toolbar-heading):not(.mesh-toolbar-toggle):not(.mesh-toolbar-close):not(.mesh-toolbar-resize) {
      min-height: 40px;
      min-width: 0;
      padding: 8px 10px;
      margin: 0;
      border: 1px solid #50596b;
      border-radius: 8px;
      background: rgba(48, 54, 66, .9);
      color: white;
      font-size: 12px;
      font-weight: 600;
      touch-action: manipulation;
    }

    .mesh-toolbar button.active:not(.mesh-toolbar-heading) {
      background: #2866d8;
      border-color: #78a6ff;
    }

    .mesh-toolbar button:disabled {
      opacity: .35;
    }

    .mesh-toolbar button.danger {
      background: #592f38 !important;
      border-color: #9b4d5c !important;
    }

    .mesh-toolbar button.primary {
      background: #245b9e !important;
      border-color: #548bd0 !important;
    }

    .mesh-toolbar-status {
      font-size: 11px;
      color: #c0c8d8;
      padding: 4px 2px;
      line-height: 1.5;
    }

    .mesh-transform-panel {
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding: 8px;
      border: 1px solid #414b5c;
      border-radius: 10px;
      background: rgba(25, 29, 37, .8);
    }

    .mesh-transform-fields {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }

    .mesh-transform-field {
      display: flex;
      flex-direction: column;
      gap: 5px;
      min-width: 0;
    }

    .mesh-transform-field label {
      font-size: 11px;
      color: #aeb7c8;
    }

    .mesh-transform-field input {
      width: 100%;
      min-width: 0;
      height: 38px;
      box-sizing: border-box;
      padding: 5px;
      border: 1px solid #50596b;
      border-radius: 7px;
      background: #303642;
      color: white;
      font-size: 14px;
    }

    .mesh-transform-apply {
      width: 100%;
      background: #245b9e !important;
      border-color: #548bd0 !important;
    }

    .mesh-transform-hint {
      font-size: 10px;
      color: #aeb7c8;
      line-height: 1.5;
    }

    .mesh-toolbar-close {
      width: 100%;
      min-height: 40px;
      margin: 0;
      border: 1px solid #596579;
      border-radius: 8px;
      background: rgba(57, 67, 84, .9);
      color: white;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .mesh-toolbar-resize {
      position: sticky;
      bottom: 0;
      left: 0;
      width: 100%;
      min-height: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 6px 0 0;
      border: 2px solid #a48be8;
      border-radius: 9px;
      background: #514078;
      color: #ffffff;
      font-size: 13px;
      font-weight: bold;
      cursor: nwse-resize;
      touch-action: none;
      z-index: 20;
    }

    .mesh-mirror-description {
      font-size: 10px;
      color: #aeb7c8;
      line-height: 1.5;
    }
  `;

  document.head.appendChild(style);

  const root = document.createElement("div");
  root.className = "mesh-toolbar-root";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "mesh-toolbar-toggle";
  toggleButton.textContent = "☰";
  toggleButton.title = "メッシュ編集メニュー";
  toggleButton.setAttribute("aria-label", "メッシュ編集メニュー");
  toggleButton.setAttribute("aria-expanded", "false");

  root.appendChild(toggleButton);

  const panel = document.createElement("div");
  panel.className = "mesh-toolbar";
  panel.hidden = true;
  root.appendChild(panel);

  function openMenu() {
    panel.hidden = false;
    toggleButton.setAttribute("aria-expanded", "true");
    toggleButton.textContent = "×";
  }

  function closeMenu() {
    panel.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.textContent = "☰";
  }

  function toggleMenu() {
    panel.hidden ? openMenu() : closeMenu();
  }

  toggleButton.addEventListener("click", event => {
    event.stopPropagation();
    toggleMenu();
  });

  root.addEventListener("click", event => {
    event.stopPropagation();
  });

  function handleOutsideClick(event) {
    if (!root.contains(event.target)) closeMenu();
  }

  document.addEventListener("pointerdown", handleOutsideClick);

  // メニューサイズ変更
  const resizeHandle = document.createElement("button");
  resizeHandle.type = "button";
  resizeHandle.className = "mesh-toolbar-resize";
  resizeHandle.textContent = "↔  メニューサイズ変更  ↕";
  resizeHandle.title = "ドラッグしてメニューのサイズを変更";
  resizeHandle.setAttribute("aria-label", "メニューサイズ変更");

  panel.appendChild(resizeHandle);

  let resizeState = null;

  resizeHandle.addEventListener("pointerdown", event => {
    event.preventDefault();
    event.stopPropagation();

    const rect = panel.getBoundingClientRect();

    resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };

    resizeHandle.setPointerCapture(event.pointerId);
  });

  resizeHandle.addEventListener("pointermove", event => {
    if (!resizeState || event.pointerId !== resizeState.pointerId) return;

    const dx = resizeState.startX - event.clientX;
    const dy = event.clientY - resizeState.startY;

    const maxWidth = Math.min(560, window.innerWidth - 24);
    const maxHeight = window.innerHeight * 0.85;

    const newWidth = Math.max(
      190,
      Math.min(maxWidth, resizeState.startWidth + dx)
    );

    const newHeight = Math.max(
      160,
      Math.min(maxHeight, resizeState.startHeight + dy)
    );

    panel.style.width = `${newWidth}px`;
    panel.style.height = `${newHeight}px`;
    panel.style.maxHeight = `${maxHeight}px`;
  });

  function stopResize(event) {
    if (!resizeState || event.pointerId !== resizeState.pointerId) return;
    resizeState = null;
  }

  resizeHandle.addEventListener("pointerup", stopResize);
  resizeHandle.addEventListener("pointercancel", stopResize);

  resizeHandle.addEventListener("lostpointercapture", () => {
    resizeState = null;
  });

  function createSection(key, title) {
    const section = document.createElement("div");
    section.className = "mesh-toolbar-section";
    section.dataset.section = key;

    const heading = document.createElement("button");
    heading.type = "button";
    heading.className = "mesh-toolbar-heading";
    heading.setAttribute("aria-expanded", "false");

    const headingText = document.createElement("span");
    headingText.textContent = title;

    const arrow = document.createElement("span");
    arrow.className = "mesh-toolbar-arrow";
    arrow.textContent = "›";

    heading.append(headingText, arrow);

    const content = document.createElement("div");
    content.className = "mesh-toolbar-content";

    heading.addEventListener("click", () => {
      const isOpen = section.classList.toggle("open");
      heading.setAttribute("aria-expanded", String(isOpen));
    });

    section.append(heading, content);
    panel.insertBefore(section, resizeHandle);

    return content;
  }

  function createButton(parent, label, action, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = options.title || label;

    if (options.className) button.classList.add(options.className);
    if (options.disabled) button.disabled = true;

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
  const modeContent = createSection("modes", "◆ 選択モード");
  const modeButtons = {};

  modeButtons.vertex = createButton(modeContent, "◆ Vertex", null, {
    callback: () => setMode("vertex")
  });

  modeButtons.edge = createButton(modeContent, "━ Edge", null, {
    callback: () => setMode("edge")
  });

  modeButtons.face = createButton(modeContent, "▰ Face", null, {
    callback: () => setMode("face")
  });

  // 選択設定
  const selectionContent = createSection("selection", "☑ 選択設定");
  let multiSelect = false;

  const multiButton = createButton(
    selectionContent,
    "複数選択：OFF",
    null,
    { callback: () => setMultiSelect(!multiSelect) }
  );

  // 左右対称編集
  const mirrorContent = createSection("mirror", "◐ 左右対称編集");

  let mirrorXEnabled = false;

  const mirrorButton = createButton(
    mirrorContent,
    "左右対称編集：OFF",
    null,
    {
      callback: () => setMirrorX(!mirrorXEnabled)
    }
  );

  const mirrorDescription = document.createElement("div");
  mirrorDescription.className = "mesh-mirror-description";
  mirrorDescription.textContent =
    "X軸を中心に反対側の頂点も同じように編集します。";

  mirrorContent.appendChild(mirrorDescription);

  function setMirrorX(value) {
    mirrorXEnabled = Boolean(value);

    mirrorButton.textContent = mirrorXEnabled
      ? "左右対称編集：ON"
      : "左右対称編集：OFF";

    mirrorButton.classList.toggle("active", mirrorXEnabled);
    mirrorButton.setAttribute(
      "aria-pressed",
      String(mirrorXEnabled)
    );

    onMirrorChange?.(mirrorXEnabled);
  }

  // 変形
  const transformContent = createSection("transform", "↔ 変形");
  const transformButtons = {};

  transformButtons.move = createButton(transformContent, "↔ 移動", null, {
    callback: () => setTransformMode("move")
  });

  transformButtons.rotate = createButton(transformContent, "⟳ 回転", null, {
    callback: () => setTransformMode("rotate")
  });

  transformButtons.scale = createButton(transformContent, "⤢ 拡大・縮小", null, {
    callback: () => setTransformMode("scale")
  });

  const transformPanel = document.createElement("div");
  transformPanel.className = "mesh-transform-panel";

  const transformHeading = document.createElement("div");
  transformHeading.className = "mesh-toolbar-status";
  transformHeading.textContent = "移動量";

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
    input.value = "0";
    input.id = `mesh-transform-${axis.toLowerCase()}`;

    label.htmlFor = input.id;

    field.append(label, input);
    transformFields.appendChild(field);
    inputs[axis.toLowerCase()] = input;
  }

  const transformStatus = document.createElement("div");
  transformStatus.className = "mesh-toolbar-status";

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
  hint.textContent = "移動は距離、回転は度数、拡大縮小は倍率。";

  transformPanel.append(
    transformHeading,
    transformFields,
    applyButton,
    hint,
    transformStatus
  );

  transformContent.appendChild(transformPanel);

  let transformMode = "move";

  function setTransformMode(mode) {
    if (!["move", "rotate", "scale"].includes(mode)) return;

    transformMode = mode;

    for (const [key, button] of Object.entries(transformButtons)) {
      button.classList.toggle("active", key === mode);
    }

    transformHeading.textContent =
      mode === "move" ? "移動量" :
      mode === "rotate" ? "回転角度（度）" :
      "拡大・縮小倍率";

    const defaults = mode === "move"
      ? ["0", "0.2", "0"]
      : mode === "rotate"
        ? ["0", "0", "15"]
        : ["1.2", "1.2", "1.2"];

    ["x", "y", "z"].forEach((axis, index) => {
      inputs[axis].value = defaults[index];
    });
  }

  function applyTransform() {
    const values = [
      Number(inputs.x.value),
      Number(inputs.y.value),
      Number(inputs.z.value)
    ];

    if (values.some(value => !Number.isFinite(value))) {
      transformStatus.textContent = "正しい数値を入力してください";
      return;
    }

    onAction?.(`transform:${transformMode}:${values.join(",")}`);
  }

  
  // スカルプト設定
  const sculptContent = createSection("sculpt", "🎨 スカルプト");

  const sculptPanel = document.createElement("div");
  sculptPanel.className = "mesh-transform-panel";

  function createSculptInput(labelText, value, step, min, max) {
    const wrapper = document.createElement("div");
    wrapper.className = "mesh-transform-field";

    const label = document.createElement("label");
    label.textContent = labelText;

    const input = document.createElement("input");
    input.type = "number";
    input.value = String(value);
    input.step = String(step);
    input.min = String(min);
    input.max = String(max);
    input.inputMode = "decimal";

    wrapper.append(label, input);
    sculptPanel.appendChild(wrapper);

    return input;
  }

  const sculptRadiusInput = createSculptInput(
    "ブラシサイズ",
    0.5,
    0.05,
    0.05,
    5
  );

  const sculptStrengthInput = createSculptInput(
    "ブラシの強さ",
    0.1,
    0.01,
    -1,
    1
  );

  function applySculpt(mode) {
    const radius = Number(sculptRadiusInput.value);
    const strength = Number(sculptStrengthInput.value);

    if (
      !Number.isFinite(radius) ||
      !Number.isFinite(strength) ||
      radius <= 0
    ) {
      statusElement.textContent =
        "ブラシサイズと強さを正しく入力してください";
      return;
    }

    onAction?.(`sculpt:${mode}:${radius}:${strength}`);
  }

  createButton(
    sculptPanel,
    "↗ 押し出し・へこませる",
    null,
    {
      className: "primary",
      callback: () => applySculpt("pushpull")
    }
  );

  createButton(
    sculptPanel,
    "〰 なめらか化",
    null,
    {
      callback: () => applySculpt("smooth")
    }
  );

  createButton(
    sculptPanel,
    "◉ 膨らませる",
    null,
    {
      callback: () => applySculpt("inflate")
    }
  );

  const sculptHint = document.createElement("div");
  sculptHint.className = "mesh-transform-hint";
  sculptHint.textContent =
    "頂点を選択してから実行。左右対称編集にも対応。";

  sculptPanel.appendChild(sculptHint);
  sculptContent.appendChild(sculptPanel);

  
  // メッシュ編集
  const editContent = createSection("edit", "✂ メッシュ編集");

  createButton(editContent, "✂ 分割", "subdivide", {
    className: "primary"
  });

  const extrudePanel = document.createElement("div");
  extrudePanel.className = "mesh-transform-panel";

  const extrudeLabel = document.createElement("label");
  extrudeLabel.textContent = "押し出す距離";
  extrudeLabel.style.color = "#c0c8d8";

  const extrudeDistanceInput = document.createElement("input");
  extrudeDistanceInput.type = "number";
  extrudeDistanceInput.step = "0.1";
  extrudeDistanceInput.inputMode = "decimal";
  extrudeDistanceInput.value = "0.2";
  extrudeDistanceInput.style.width = "100%";
  extrudeDistanceInput.style.height = "40px";
  extrudeDistanceInput.style.boxSizing = "border-box";
  extrudeDistanceInput.style.background = "#303642";
  extrudeDistanceInput.style.color = "white";
  extrudeDistanceInput.style.border = "1px solid #50596b";
  extrudeDistanceInput.style.borderRadius = "7px";
  extrudeDistanceInput.style.padding = "6px";

  const extrudeApplyButton = createButton(
    extrudePanel,
    "⬆ この距離で押し出し",
    null,
    {
      className: "mesh-transform-apply",
      callback: () => {
        const distance = Number(extrudeDistanceInput.value);

        if (!Number.isFinite(distance)) {
          statusElement.textContent = "正しい距離を入力してください";
          return;
        }

        onAction?.(`extrude:${distance}`);
      }
    }
  );

  extrudePanel.append(
    extrudeLabel,
    extrudeDistanceInput,
    extrudeApplyButton
  );

  editContent.appendChild(extrudePanel);

  createButton(editContent, "＋ 頂点追加", "addVertex", {
    disabled: true
  });

  createButton(editContent, "⌫ 削除", "delete", {
    className: "danger"
  });

  // その他
  const utilityContent = createSection("utility", "⚙ その他");

  createButton(utilityContent, "選択解除", "clear");
  createButton(utilityContent, "↶ 元に戻す", "undo");
  createButton(utilityContent, "↷ やり直す", "redo");

  // ギズモ
  const gizmoContent = createSection("gizmo", "表示設定");
  let gizmoVisible = true;

  const gizmoButton = createButton(
    gizmoContent,
    "XYZギズモ：ON",
    null,
    {
      callback: () => setGizmoVisible(!gizmoVisible)
    }
  );

  function setGizmoVisible(value) {
    gizmoVisible = Boolean(value);

    gizmoButton.textContent = gizmoVisible
      ? "XYZギズモ：ON"
      : "XYZギズモ：OFF";

    gizmoButton.classList.toggle("active", gizmoVisible);
    gizmoButton.setAttribute("aria-pressed", String(gizmoVisible));

    onGizmoVisibilityChange?.(gizmoVisible);
  }

  // 編集モード
  const modeControlContent = createSection("modeControl", "◈ 編集モード");

  const editModeButton = createButton(
    modeControlContent,
    "メッシュ編集",
    "editMode",
    { className: "primary" }
  );

  const objectModeButton = createButton(
    modeControlContent,
    "オブジェクトモードに戻る",
    "objectMode"
  );

  // ステータス
  const statusElement = document.createElement("div");
  statusElement.className = "mesh-toolbar-status";
  statusElement.textContent = "Vertex / Edge / Face から選択してね";
  panel.insertBefore(statusElement, resizeHandle);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "mesh-toolbar-close";
  closeButton.textContent = "メニューを閉じる";
  closeButton.addEventListener("click", closeMenu);
  panel.insertBefore(closeButton, resizeHandle);

  container.replaceChildren(root);

  let currentMode = "vertex";

  function setMode(mode) {
    if (!["vertex", "edge", "face"].includes(mode)) return;

    currentMode = mode;

    for (const [key, button] of Object.entries(modeButtons)) {
      button.classList.toggle("active", key === mode);
      button.setAttribute("aria-pressed", String(key === mode));
    }

    statusElement.textContent = `${mode.toUpperCase()} モード`;
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
    const editing = Boolean(value);

    editModeButton.classList.toggle("active", editing);
    objectModeButton.classList.toggle("active", !editing);

    statusElement.textContent = editing
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
    setGizmoVisible,
    setMirrorX,

    dispose() {
      document.removeEventListener("pointerdown", handleOutsideClick);
      root.remove();
      style.remove();
    }
  };
}
