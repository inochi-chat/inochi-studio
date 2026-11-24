
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { initializeEditor } from "./core/editor-init.js";

import { createGeometry } from "./objects/object-factory.js";
import { createObjectManager } from "./objects/object-manager.js";
import { createObjectList } from "./objects/object-list.js";
import { createHierarchyUI } from "./objects/hierarchy-ui.js";
import { createObjectHierarchy } from "./objects/object-hierarchy.js";
import { createHierarchyOrder } from "./objects/hierarchy-order.js";
import { createObjectVisibility } from "./objects/object-visibility.js";

import { createNameEditor } from "./properties/name.js";
import { createPositionEditor } from "./properties/position.js";
import { createRotationEditor } from "./properties/rotation.js";
import { createScaleEditor } from "./properties/scale.js";
import { createColorEditor } from "./properties/color.js";

import { createObjectSelection } from "./selection/object-selection.js";
import { createTransformTool } from "./tools/transform-tool.js";

import { createHistoryManager } from "./history/history-manager.js";

import {
  createAddObjectCommand,
  createDeleteObjectCommand,
  createDuplicateObjectCommand
} from "./history/object-commands.js";

import {
  createSetParentCommand,
  createRemoveParentCommand
} from "./history/hierarchy-commands.js";

import {
  createMoveHierarchyObjectCommand
} from "./history/hierarchy-order-commands.js";

import {
  createVisibilityCommand
} from "./history/visibility-command.js";

import { createDuplicateButton } from "./objects/duplicate-button.js";

// 1. HTML要素
const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectListContainer = document.querySelector("#objectList");
const hierarchyListContainer = document.querySelector("#hierarchyList");
const hierarchyControlsContainer = document.querySelector("#hierarchyControls");

if (
  !canvas ||
  !propertyPanel ||
  !objectListContainer ||
  !hierarchyListContainer ||
  !hierarchyControlsContainer
) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}

// 2. エディター初期化
const { scene, camera, renderer } = initializeEditor(canvas);

// 3. 管理システム
const objectManager = createObjectManager(scene);
const hierarchy = createObjectHierarchy(scene, objectManager);
const hierarchyOrder = createHierarchyOrder(objectManager, scene);
const visibility = createObjectVisibility();
const history = createHistoryManager(100);

function getSelectedObject() {
  return objectManager.getSelected();
}

// 4. UI更新
let objectListView;
let hierarchyUI;

function updateObjectList() {
  objectListView.render(
    objectManager.getAll(),
    getSelectedObject()
  );
}

function updateHierarchy() {
  hierarchyUI.update(
    objectManager.getAll(),
    getSelectedObject()
  );
}

function refreshEditorUI() {
  updateObjectList();
  updateHierarchy();
}

// 5. カメラ操作
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// 6. 変形ツール
const transform = createTransformTool(
  camera,
  renderer,
  scene,
  orbit
);

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});

// 7. プロパティ表示
function refreshProperties() {
  propertyPanel.innerHTML = "";

  const object = getSelectedObject();

  if (!object) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent =
      "オブジェクトを選択すると、ここで詳細を編集できるよ。";

    propertyPanel.appendChild(empty);
    return;
  }

  const inner = document.createElement("div");
  inner.className = "properties-inner";

  inner.appendChild(createNameEditor(object, refreshEditorUI));
  inner.appendChild(createPositionEditor(object, refreshEditorUI));
  inner.appendChild(createRotationEditor(object));
  inner.appendChild(createScaleEditor(object));
  inner.appendChild(createColorEditor(object));

  propertyPanel.appendChild(inner);
}

// 8. オブジェクト選択
function selectObject(object) {
  objectManager.select(object);

  const selectedObject = getSelectedObject();

  if (selectedObject) {
    transform.attach(selectedObject);
  } else {
    transform.detach();
  }

  refreshEditorUI();
  refreshProperties();
}

// 9. オブジェクト一覧
objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// 10. 階層UI
hierarchyUI = createHierarchyUI({
  listContainer: hierarchyListContainer,
  controlsContainer: hierarchyControlsContainer,
  scene,
  hierarchy,
  onSelect: selectObject,
  onSetParent: setObjectParent,
  onRemoveParent: removeObjectParent,
  onMove: moveHierarchyObject,
  visibility,
  onVisibilityChange: handleVisibilityChange
});

// 11. 履歴変更時
function onHistoryChange(object) {
  selectObject(object);
}

// 12. オブジェクト追加
function addObject(type) {
  const geometry = createGeometry(type);

  if (!geometry) return;

  const command = createAddObjectCommand(
    objectManager,
    geometry,
    type,
    onHistoryChange
  );

  history.execute(command);
}

function addCube() {
  addObject("cube");
}

function addSphere() {
  addObject("sphere");
}

function addCylinder() {
  addObject("cylinder");
}

// 13. オブジェクト削除
function deleteSelectedObject() {
  const object = getSelectedObject();

  if (!object) return;

  if (hierarchy.hasChildren(object)) {
    alert("子オブジェクトがあるため、先に親子関係を解除してください。");
    return;
  }

  const command = createDeleteObjectCommand(
    objectManager,
    object,
    onHistoryChange
  );

  history.execute(command);
}

// 14. オブジェクト複製
function duplicateSelectedObject(object) {
  if (!object) return;

  if (hierarchy.hasChildren(object)) {
    alert("子オブジェクトがあるため、現在は複製できません。");
    return;
  }

  const command = createDuplicateObjectCommand(
    objectManager,
    object,
    onHistoryChange
  );

  history.execute(command);
}

createDuplicateButton({
  button: document.querySelector("#duplicateObject"),
  getSelectedObject,
  onDuplicate: duplicateSelectedObject
});

// 15. 親子関係の設定
function setObjectParent(child, parent) {
  if (!hierarchy.canSetParent(child, parent)) {
    alert("この親子関係は設定できません。");
    return;
  }

  const command = createSetParentCommand(
    hierarchy,
    child,
    parent,
    () => {
      refreshEditorUI();
      refreshProperties();
    }
  );

  if (command) {
    history.execute(command);
  }
}

// 16. 親子関係の解除
function removeObjectParent(child) {
  const command = createRemoveParentCommand(
    hierarchy,
    child,
    () => {
      refreshEditorUI();
      refreshProperties();
    }
  );

  if (command) {
    history.execute(command);
  }
}

// 17. 階層の並び替え
function moveHierarchyObject(object, target, position) {
  if (!hierarchyOrder.canMove(object, target)) {
    return;
  }

  const siblings = hierarchyOrder.getSiblings(object);

  const oldIndex = hierarchyOrder.getIndex(object);
  const targetIndex = siblings.indexOf(target);

  if (oldIndex < 0 || targetIndex < 0) return;

  let newIndex = targetIndex +
    (position === "after" ? 1 : 0);

  if (oldIndex < newIndex) {
    newIndex--;
  }

  if (oldIndex === newIndex) return;

  const command = createMoveHierarchyObjectCommand(
    hierarchyOrder,
    object,
    newIndex,
    refreshEditorUI
  );

  if (command) {
    history.execute(command);
  }
}

// 18. 表示・非表示の変更
function handleVisibilityChange(object, newVisible) {
  const command = createVisibilityCommand(
    visibility,
    object,
    newVisible,
    refreshEditorUI
  );

  if (command) {
    history.execute(command);
  }
}

// 19. Undo・Redo
function undo() {
  history.undo();
}

function redo() {
  history.redo();
}

// 20. 3D画面からの選択
createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  onSelect: selectObject
});

// 21. ボタン接続
document.querySelector("#addCube")
  ?.addEventListener("click", addCube);

document.querySelector("#addSphere")
  ?.addEventListener("click", addSphere);

document.querySelector("#addCylinder")
  ?.addEventListener("click", addCylinder);

document.querySelector("#moveTool")
  ?.addEventListener("click", () => {
    transform.setMode("translate");
  });

document.querySelector("#rotateTool")
  ?.addEventListener("click", () => {
    transform.setMode("rotate");
  });

document.querySelector("#scaleTool")
  ?.addEventListener("click", () => {
    transform.setMode("scale");
  });

document.querySelector("#deleteObject")
  ?.addEventListener("click", deleteSelectedObject);

document.querySelector("#undoButton")
  ?.addEventListener("click", undo);

document.querySelector("#redoButton")
  ?.addEventListener("click", redo);

// 22. キーボードショートカット
document.addEventListener("keydown", event => {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) {
    return;
  }

  if (!(event.ctrlKey || event.metaKey)) return;

  if (event.key.toLowerCase() === "z") {
    event.preventDefault();

    if (event.shiftKey) {
      redo();
    } else {
      undo();
    }
  }

  if (event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  }
});

// 23. 初期キューブ
const initialCubeGeometry = createGeometry("cube");

const initialCube = objectManager.add(
  initialCubeGeometry,
  "Cube"
);

if (initialCube) {
  selectObject(initialCube);
}

// 24. 描画ループ
function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();

console.log("Inochi Studio 3D Editor Ready");
