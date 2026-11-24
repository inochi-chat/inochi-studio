
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";

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

const objectListView = createObjectList(
  objectListContainer,
  (object) => selectObject(object)
);

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

const transform = new TransformControls(camera, renderer.domElement);
scene.add(transform.getHelper());

transform.addEventListener("dragging-changed", (event) => {
  orbit.enabled = !event.value;
});

transform.addEventListener("mouseUp", () => {
  refreshProperties();
});

// ----------------------------------------
// 5. オブジェクト追加・削除
// ----------------------------------------

function addObject(geometry, type) {
  if (!geometry) return;

  const object = objectManager.add(geometry, type);

  if (!object) return;

  selectObject(object);
}

function addCube() {
  addObject(createGeometry("cube"), "Cube");
}

function addSphere() {
  addObject(createGeometry("sphere"), "Sphere");
}

function addCylinder() {
  addObject(createGeometry("cylinder"), "Cylinder");
}

function deleteSelectedObject() {
  const object = getSelectedObject();

  if (!object) return;

  transform.detach();
  objectManager.remove(object);

  updateObjectList();
  refreshProperties();
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
// 7. プロパティ画面
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
    createNameEditor(object, () => {
      updateObjectList();
    })
  );

  inner.appendChild(
    createPositionEditor(object, () => {
      updateObjectList();
    })
  );

  inner.appendChild(
    createRotationEditor(object, () => {
      updateObjectList();
    })
  );

  inner.appendChild(
    createScaleEditor(object, () => {
      updateObjectList();
    })
  );

  inner.appendChild(
    createColorEditor(object)
  );

  propertyPanel.appendChild(inner);
}

// ----------------------------------------
// 8. 画面上のオブジェクト選択機能
// ----------------------------------------

const objectSelection = createObjectSelection({
  camera,
  renderer,
  objectManager,
  transform,
  onSelect: selectObject
});

// ----------------------------------------
// 9. ボタン接続
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
// 10. 描画ループ
// ----------------------------------------

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();

// ----------------------------------------
// 11. 初期オブジェクト
// ----------------------------------------

addCube();

console.log("Inochi Studio 3D Editor Ready");
