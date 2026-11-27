
export function createMeshToolbar({
  container,
  onModeChange = () => {},
  onMultiSelectChange = () => {},
  onAction = () => {}
}) {
  if (!container) {
    throw new Error("メッシュツールバーの表示先がありません。");
  }

  let selectionMode = "vertex";
  let multiSelect = false;

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
      color: white;
      border-radius: 14px;
      font-family: sans-serif;
    }

    .mesh-toolbar-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }

    .mesh-toolbar button {
      min-height: 48px;
      border: 1px solid #454b59;
      border-radius: 10px;
      background: #303541;
      color: white;
      font-size: 13px;
      font-weight: 600;
      touch-action: manipulation;
    }

    .mesh-toolbar button:active {
      transform: scale(0.96);
    }

    .mesh-toolbar button.active {
      background: #5865d9;
      border-color: #8b95ff;
    }

    .mesh-toolbar button.danger {
      background: #703b49;
    }

    .mesh-toolbar-label {
      font-size: 12px;
      color: #b8bdca;
      font-weight: bold;
    }

    @media (max-width: 420px) {
      .mesh-toolbar {
        padding: 9px;
        gap: 8px;
      }

      .mesh-toolbar-row {
        gap: 6px;
      }

      .mesh-toolbar button {
        min-height: 46px;
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);

  const root = document.createElement("div");
  root.className = "mesh-toolbar";

  root.innerHTML = `
    <div class="mesh-toolbar-label">選択モード</div>

    <div class="mesh-toolbar-row">
      <button type="button" data-mode="vertex" class="active">
        頂点
      </button>

      <button type="button" data-mode="edge">
        辺
      </button>

      <button type="button" data-mode="face">
        面
      </button>

      <button type="button" data-action="multi">
        複数選択
      </button>
    </div>

    <div class="mesh-toolbar-label">メッシュ編集</div>

    <div class="mesh-toolbar-row">
      <button type="button" data-action="addVertex">
        頂点追加
      </button>

      <button type="button" data-action="subdivide">
        分割
      </button>

      <button type="button" data-action="extrude">
        押し出し
      </button>

      <button type="button" data-action="delete" class="danger">
        削除
      </button>
    </div>

    <div class="mesh-toolbar-label">操作</div>

    <div class="mesh-toolbar-row">
      <button type="button" data-action="move">
        移動
      </button>

      <button type="button" data-action="rotate">
        回転
      </button>

      <button type="button" data-action="scale">
        拡大縮小
      </button>

      <button type="button" data-action="clear">
        選択解除
      </button>
    </div>

    <div class="mesh-toolbar-row">
      <button type="button" data-action="undo">
        ↶ 戻す
      </button>

      <button type="button" data-action="redo">
        ↷ やり直す
      </button>

      <button type="button" data-action="editMode">
        編集終了
      </button>

      <button type="button" data-action="objectMode">
        オブジェクト
      </button>
    </div>
  `;

  container.appendChild(root);

  root.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button || !root.contains(button)) return;

    const mode = button.dataset.mode;
    const action = button.dataset.action;

    if (mode) {
      selectionMode = mode;

      root.querySelectorAll("[data-mode]").forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.mode === selectionMode
        );
      });

      onModeChange(selectionMode);
      return;
    }

    if (action === "multi") {
      multiSelect = !multiSelect;

      button.classList.toggle("active", multiSelect);

      onMultiSelectChange(multiSelect);
      return;
    }

    if (action) {
      onAction(action);
    }
  });

  function setMode(mode) {
    if (!["vertex", "edge", "face"].includes(mode)) return;

    selectionMode = mode;

    root.querySelectorAll("[data-mode]").forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.mode === mode
      );
    });
  }

  function dispose() {
    root.remove();
    style.remove();
  }

  return {
    element: root,
    setMode,
    dispose
  };
}
