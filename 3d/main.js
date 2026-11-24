
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
// 7. 数値入力欄（サイズ用）
// ----------------------------------------

function makeNumberInput(label, value, onChange) {
  const row = document.createElement("div");
  row.className = "property-row";

  const text = document.createElement("label");
  text.textContent = label;

  const input = document.createElement("input");
  input.type = "number";
  input.step = "0.1";
  input.value = Number(value.toFixed(2));

  input.addEventListener("change", () => {
    const number = Number(input.value);

    if (!Number.isFinite(number)) return;

    onChange(number);
    updateObjectList();
  });

  row.append(text, input);

  return row;
}

// ----------------------------------------
// 8. サイズ編集
// ----------------------------------------

function makeScaleEditor(object) {
  const group = document.createElement("div");
  group.className = "property-group";

  const heading = document.createElement("h3");
  heading.textContent = "サイズ";

  group.appendChild(heading);

  ["X", "Y", "Z"].forEach((axis, index) => {
    const key = axis.toLowerCase();

    group.appendChild(
      makeNumberInput(axis, object.scale[key], (value) => {
        object.scale.setComponent(index, value);
        refreshProperties();
      })
    );
  });

  return group;
}

// ----------------------------------------
// 9. プロパティ画面
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

  // 名前
  inner.appendChild(
    createNameEditor(object, () => {
      updateObjectList();
    })
  );

  // 位置
  inner.appendChild(
    createPositionEditor(object, () => {
      updateObjectList();
    })
  );

  // 回転
  inner.appendChild(
    createRotationEditor(object, () => {
      updateObjectList();
    })
  );

  // サイズ
  inner.appendChild(makeScaleEditor(object));

  // カラー
  const colorGroup = document.createElement("div");
  colorGroup.className = "property-group";

  const colorHeading = document.createElement("h3");
  colorHeading.textContent = "カラー";

  colorGroup.appendChild(colorHeading);

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = "#" + object.material.color.getHexString();

  colorInput.addEventListener("input", () => {
    object.material.color.set(colorInput.value);
  });

  colorGroup.appendChild(colorInput);
  inner.appendChild(colorGroup);

  propertyPanel.appendChild(inner);
}

// ----------------------------------------
// 10. 画面からオブジェクトを選択
// ----------------------------------------

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function selectAtPointer(event) {
  if (transform.dragging) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(
    objectManager.getAll(),
    false
  );

  if (hits.length > 0) {
    selectObject(hits[0].object);
  } else {
    selectObject(null);
  }
}

renderer.domElement.addEventListener("pointerdown", selectAtPointer);

// ----------------------------------------
// 11. ボタン接続
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
// 12. 描画ループ
// ----------------------------------------

function animate() {
  requestAnimationFrame(animate);

  orbit.update();
  renderer.render(scene, camera);
}

animate();

// ----------------------------------------
// 13. 初期オブジェクト
// ----------------------------------------

addCube();

console.log("Inochi Studio 3D Editor Ready");
