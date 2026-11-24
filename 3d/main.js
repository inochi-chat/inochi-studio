
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { initializeEditor } from "./core/editor-init.js";

import { createGeometry } from "./objects/object-factory.js";
import { createObjectManager } from "./objects/object-manager.js";
import { createObjectList } from "./objects/object-list.js";

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

import { createDuplicateButton } from "./objects/duplicate-button.js";

// 1. 初期化
const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectListContainer = document.querySelector("#objectList");

if (!canvas || !propertyPanel || !objectListContainer) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}

const { scene, camera, renderer } = initializeEditor(canvas);

// 2. 管理システム
const objectManager = createObjectManager(scene);
const history = createHistoryManager(100);

function getSelectedObject() {
  return objectManager.getSelected();
}

// 3. オブジェクト一覧
let objectListView;

function updateObjectList() {
  objectListView.render(
    objectManager.getAll(),
    getSelectedObject()
  );
}

// 4. カメラ操作
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// 5. 変形ツール
const transform = createTransformTool(
  camera,
  renderer,
  scene,
  orbit
);

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});

// 6. プロパティ表示
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

  inner.appendChild(
    createNameEditor(object, updateObjectList)
  );

  inner.appendChild(
    createPositionEditor(object, updateObjectList)
  );

  inner.appendChild(
    createRotationEditor(object)
  );

  inner.appendChild(
    createScaleEditor(object)
  );

  inner.appendChild(
    createColorEditor(object)
  );

  propertyPanel.appendChild(inner);
}

// 7. 選択処理
function selectObject(object) {
  objectManager.select(object);

  const selectedObject = getSelectedObject();

  if (selectedObject) {
    transform.attach(selectedObject);
  } else {
    transform.detach();
  }

  updateObjectList();
  refreshProperties();
}

// 8. オブジェクト一覧の接続
objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// 9. 履歴変更時の処理
function onHistoryChange(object) {
  selectObject(object);
}

// 10. オブジェクト追加
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

// 11. オブジェクト削除
function deleteSelectedObject() {
  const object = getSelectedObject();

  if (!object) return;

  const command = createDeleteObjectCommand(
    objectManager,
    object,
    onHistoryChange
  );

  history.execute(command);
}

// 12. オブジェクト複製
function duplicateSelectedObject(object) {
  const command = createDuplicateObjectCommand(
    objectManager,
    object,
    onHistoryChange
  );

  history.execute(command);
}

// 複製ボタン接続
createDuplicateButton({
  button: document.querySelector("#duplicateObject"),
  getSelectedObject,
  onDuplicate: duplicateSelectedObject
});

// 13. Undo・Redo
function undo() {
  history.undo();
}

function redo() {
  history.redo();
}

// 14. オブジェクト選択
createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  onSelect: selectObject
});

// 15. ボタン接続
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

// 16. キーボードショートカット
document.addEventListener("keydown", (event) => {
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

// 17. 描画ループ
function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();

// 18. 初期キューブ
const initialCubeGeometry = createGeometry("cube");

const initialCube = objectManager.add(
  initialCubeGeometry,
  "Cube"
);

if (initialCube) {
  selectObject(initialCube);
}

console.log("Inochi Studio 3D Editor Ready");
