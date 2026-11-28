
import { getDeformerById } from "./deformer-manager.js";
import { getDeformerAncestors } from "./deformer-hierarchy.js";

const DEG_TO_RAD = Math.PI / 180;

export function getLocalTransform(deformer) {
  if (!deformer) {
    return createIdentityTransform();
  }

  return {
    x: deformer.x || 0,
    y: deformer.y || 0,
    rotation: (deformer.rotation || 0) * DEG_TO_RAD,
    scaleX: deformer.scaleX ?? 1,
    scaleY: deformer.scaleY ?? 1
  };
}

export function getWorldTransform(state, deformerId) {
  const deformer = getDeformerById(state, deformerId);

  if (!deformer) {
    return null;
  }

  const ancestors = getDeformerAncestors(state, deformerId)
    .reverse();

  let result = createIdentityTransform();

  for (const item of [...ancestors, deformer]) {
    result = combineTransforms(
      result,
      getLocalTransform(item)
    );
  }

  return result;
}

export function combineTransforms(parent, child) {
  const cos = Math.cos(parent.rotation);
  const sin = Math.sin(parent.rotation);

  const scaledX = child.x * parent.scaleX;
  const scaledY = child.y * parent.scaleY;

  return {
    x: parent.x + scaledX * cos - scaledY * sin,
    y: parent.y + scaledX * sin + scaledY * cos,
    rotation: parent.rotation + child.rotation,
    scaleX: parent.scaleX * child.scaleX,
    scaleY: parent.scaleY * child.scaleY
  };
}

export function transformPoint(point, transform) {
  if (!point || !transform) {
    return null;
  }

  const scaledX = point.x * transform.scaleX;
  const scaledY = point.y * transform.scaleY;

  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  return {
    x: transform.x + scaledX * cos - scaledY * sin,
    y: transform.y + scaledX * sin + scaledY * cos
  };
}

export function inverseTransformPoint(point, transform) {
  if (!point || !transform) {
    return null;
  }

  const deltaX = point.x - transform.x;
  const deltaY = point.y - transform.y;

  const cos = Math.cos(-transform.rotation);
  const sin = Math.sin(-transform.rotation);

  const rotatedX = deltaX * cos - deltaY * sin;
  const rotatedY = deltaX * sin + deltaY * cos;

  return {
    x: rotatedX / (transform.scaleX || 1),
    y: rotatedY / (transform.scaleY || 1)
  };
}

export function createIdentityTransform() {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  };
}

export function setDeformerPosition(
  state,
  deformerId,
  x,
  y
) {
  const deformer = getDeformerById(state, deformerId);

  if (
    !deformer ||
    deformer.locked ||
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return false;
  }

  deformer.x = x;
  deformer.y = y;

  return true;
}

export function setDeformerRotation(
  state,
  deformerId,
  rotation
) {
  const deformer = getDeformerById(state, deformerId);

  if (
    !deformer ||
    deformer.locked ||
    !Number.isFinite(rotation)
  ) {
    return false;
  }

  deformer.rotation = rotation;

  return true;
}

export function setDeformerScale(
  state,
  deformerId,
  scaleX,
  scaleY
) {
  const deformer = getDeformerById(state, deformerId);

  if (
    !deformer ||
    deformer.locked ||
    !Number.isFinite(scaleX) ||
    !Number.isFinite(scaleY) ||
    scaleX === 0 ||
    scaleY === 0
  ) {
    return false;
  }

  deformer.scaleX = scaleX;
  deformer.scaleY = scaleY;

  return true;
}
