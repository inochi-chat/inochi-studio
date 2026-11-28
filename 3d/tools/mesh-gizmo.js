
import * as THREE from "three";

export function createMeshGizmo({
  scene,
  camera,
  renderer,
  mesh,
  topology,
  operations,
  meshEditor,
  meshHistory,
  orbitControls
}) {
  if (!scene || !camera || !renderer || !mesh || !topology) {
    throw new Error("メッシュギズモの設定が不足しています。");
  }

  const group = new THREE.Group();
  scene.add(group);

  const directions = [
    {
      axis: "x",
      direction: new THREE.Vector3(1, 0, 0),
      color: 0xff4444
    },
    {
      axis: "y",
      direction: new THREE.Vector3(0, 1, 0),
      color: 0x44dd66
    },
    {
      axis: "z",
      direction: new THREE.Vector3(0, 0, 1),
      color: 0x4488ff
    }
  ];

  const arrows = [];

  for (const item of directions) {
    const arrow = new THREE.ArrowHelper(
      item.direction,
      new THREE.Vector3(),
      1,
      item.color,
      0.22,
      0.12
    );

    arrow.userData.axis = item.axis;

    group.add(arrow);
    arrows.push(arrow);
  }

  group.visible = false;

  let gizmoEnabled = true;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  let selectedIds = [];
  let dragging = false;
  let activePointerId = null;
  let dragAxis = null;
  let dragPlane = null;
  let lastDragPoint = null;

  function getArrowLength(center) {
    if (camera.isPerspectiveCamera) {
      const distance = camera.position.distanceTo(center);
      return Math.max(0.3, distance * 0.18);
    }

    if (camera.isOrthographicCamera) {
      return Math.max(0.3, (camera.top - camera.bottom) * 0.15);
    }

    return 1;
  }

  function update(vertexIds = []) {
    selectedIds = [...vertexIds];

    if (!selectedIds.length) {
      group.visible = false;
      return;
    }

    mesh.updateWorldMatrix(true, false);

    const center = new THREE.Vector3();
    let count = 0;

    for (const id of selectedIds) {
      const vertex = topology.getVertex(id);

      if (!vertex) continue;

      const worldPosition = mesh.localToWorld(
        new THREE.Vector3(
          vertex.position.x,
          vertex.position.y,
          vertex.position.z
        )
      );

      center.add(worldPosition);
      count++;
    }

    if (count === 0) {
      group.visible = false;
      return;
    }

    center.divideScalar(count);

    group.position.copy(center);
    group.quaternion.identity();

    const length = getArrowLength(center);

    for (const arrow of arrows) {
      arrow.setLength(
        length,
        length * 0.22,
        length * 0.12
      );
    }

    group.visible = gizmoEnabled;
  }

  function setVisible(value) {
    gizmoEnabled = Boolean(value);

    if (!gizmoEnabled && dragging) {
      finishDrag();
    }

    group.visible = gizmoEnabled && selectedIds.length > 0;
  }

  function getPointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();

    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
  }

  function getArrowAxis(object) {
    let current = object;

    while (current && current !== group) {
      if (current.userData?.axis) {
        return directions.find(
          item => item.axis === current.userData.axis
        )?.direction.clone() ?? null;
      }

      current = current.parent;
    }

    return null;
  }

  function getPlane(axis) {
    const viewDirection = camera.position
      .clone()
      .sub(group.position)
      .normalize();

    let normal = viewDirection
      .clone()
      .sub(axis.clone().multiplyScalar(viewDirection.dot(axis)));

    if (normal.lengthSq() < 0.0001) {
      normal = camera.up.clone().cross(axis);
    }

    if (normal.lengthSq() < 0.0001) {
      normal = new THREE.Vector3(0, 0, 1);
    }

    normal.normalize();

    return new THREE.Plane().setFromNormalAndCoplanarPoint(
      normal,
      group.position
    );
  }

  function getIntersection() {
    const point = new THREE.Vector3();

    if (!raycaster.ray.intersectPlane(dragPlane, point)) {
      return null;
    }

    return point;
  }

  function onPointerDown(event) {
    if (
      !gizmoEnabled ||
      !group.visible ||
      !operations ||
      !meshEditor ||
      !meshHistory
    ) {
      return;
    }

    if (event.button !== undefined && event.button !== 0) {
      return;
    }

    if (selectedIds.length === 0) return;

    getPointer(event);

    raycaster.params.Line.threshold = Math.max(
      0.04,
      getArrowLength(group.position) * 0.08
    );

    const intersections = raycaster.intersectObjects(arrows, true);

    if (!intersections.length) return;

    const axis = getArrowAxis(intersections[0].object);

    if (!axis) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    dragging = true;
    activePointerId = event.pointerId;
    dragAxis = axis;
    dragPlane = getPlane(axis);

    lastDragPoint = getIntersection();

    if (!lastDragPoint) {
      dragging = false;
      activePointerId = null;
      return;
    }

    meshHistory.save();

    if (orbitControls) {
      orbitControls.enabled = false;
    }

    try {
      renderer.domElement.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer Captureが使えない場合もドラッグを続ける
    }
  }

  function onPointerMove(event) {
    if (!dragging || event.pointerId !== activePointerId) return;

    event.preventDefault();

    getPointer(event);

    const currentPoint = getIntersection();

    if (!currentPoint || !lastDragPoint) return;

    const worldDelta = currentPoint
      .clone()
      .sub(lastDragPoint);

    const amount = worldDelta.dot(dragAxis);

    lastDragPoint.copy(currentPoint);

    if (Math.abs(amount) < 0.000001) return;

    mesh.updateWorldMatrix(true, false);

    const worldStart = group.position.clone();
    const worldEnd = worldStart
      .clone()
      .add(dragAxis.clone().multiplyScalar(amount));

    const localStart = mesh.worldToLocal(worldStart);
    const localEnd = mesh.worldToLocal(worldEnd);

    const localDelta = localEnd.sub(localStart);

    const success = operations.move(
      localDelta.x,
      localDelta.y,
      localDelta.z
    );

    if (success) {
      update(selectedIds);
    }
  }

  function finishDrag(event) {
    if (!dragging) return;

    if (
      event &&
      activePointerId !== null &&
      event.pointerId !== activePointerId
    ) {
      return;
    }

    dragging = false;
    activePointerId = null;
    dragAxis = null;
    dragPlane = null;
    lastDragPoint = null;

    if (orbitControls) {
      orbitControls.enabled = true;
    }

    if (selectedIds.length) {
      update(selectedIds);
    }
  }

  function dispose() {
    finishDrag();

    renderer.domElement.removeEventListener(
      "pointerdown",
      onPointerDown,
      true
    );

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", finishDrag);

    scene.remove(group);

    for (const arrow of arrows) {
      arrow.line.geometry.dispose();
      arrow.cone.geometry.dispose();

      arrow.line.material.dispose();
      arrow.cone.material.dispose();
    }
  }

  renderer.domElement.addEventListener(
    "pointerdown",
    onPointerDown,
    true
  );

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);

  return {
    update,
    setVisible,
    dispose
  };
}
