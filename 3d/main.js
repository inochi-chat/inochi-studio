
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
  createDeleteObjectCommand
} from "./history/object-commands.js";

// ----------------------------------------
// 1. エディター初期化
// ----------------------------------------

const canvas = document.querySelector("#threeCanvas");
const propertyPanel = document.querySelector("#propertyPanel");
const objectListContainer = document.querySelector("#objectList");

if (!canvas || !propertyPanel || !objectListContainer) {
  throw new Error("3DエディターのHTML要素が見つかりません");
}

const { scene, camera, renderer } = initializeEditor(canvas);

// ----------------------------------------
// 2. オブジェクト管理
// ----------------------------------------

const objectManager = createObjectManager(scene);
const history = createHistoryManager(100);

function getSelectedObject() {
  return objectManager.getSelected();
}

function updateObjectList() {
  objectListView.render(
    objectManager.getAll(),
    getSelectedObject()
  );
}

// ----------------------------------------
// 3. カメラ操作
// ----------------------------------------

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;

// ----------------------------------------
// 4. 変形ツール
// ----------------------------------------

const transform = createTransformTool(
  camera,
  renderer,
  scene,
  orbit
);

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});

// ----------------------------------------
// 5. プロパティ画面
// ----------------------------------------

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

  inner.appendChild(createRotationEditor(object));
  inner.appendChild(createScaleEditor(object));
  inner.appendChild(createColorEditor(object));

  propertyPanel.appendChild(inner);
}

// ----------------------------------------
// 6. オブジェクト選択
// ----------------------------------------

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

// ----------------------------------------
// 7. オブジェクト一覧
// ----------------------------------------

const objectListView = createObjectList(
  objectListContainer,
  selectObject
);

// ----------------------------------------
// 8. 履歴変更後の画面更新
// ----------------------------------------

function onHistoryChange(object) {
  selectObject(object);
}

// ----------------------------------------
// 9. オブジェクト追加
// ----------------------------------------

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

// ----------------------------------------
// 10. オブジェクト削除
// ----------------------------------------

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

// ----------------------------------------
// 11. Undo・Redo
// ----------------------------------------

function undo() {
  if (history.undo()) {
    console.log("Undo:", history.undoCount);
  }
}

function redo() {
  if (history.redo()) {
    console.log("Redo:", history.redoCount);
  }
}

// ----------------------------------------
// 12. 画面上のオブジェクト選択
// ----------------------------------------

createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  onSelect: selectObject
});

// ----------------------------------------
// 13. ボタン接続
// ----------------------------------------

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

// ----------------------------------------
// 14. キーボードショートカット
// ----------------------------------------

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

// ----------------------------------------
// 15. 描画ループ
// ----------------------------------------

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();


// ----------------------------------------
// 16. 初期オブジェクト
// ----------------------------------------


const initialCubeGeometry = createGeometry("cube");

console.log("① Geometry:", initialCubeGeometry);

const initialCube = objectManager.add(
  initialCubeGeometry,
  "Cube"
);

console.log("② Object:", initialCube);
console.log("③ Scene children:", scene.children);
console.log("④ Object count:", objectManager.getCount());

if (initialCube) {
  selectObject(initialCube);
}

console.log("Inochi Studio 3D Editor Ready");
