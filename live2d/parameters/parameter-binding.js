
import { getParameterById } from "./parameter-manager.js";
import { getDeformerById } from "../deformers/deformer-manager.js";
import { getMeshById } from "../mesh/mesh-manager.js";

export function initializeParameterBinding(state) {
  if (!Array.isArray(state.bindings)) {
    state.bindings = [];
  }

  state.bindingManager = {
    nextId: 1
  };

  console.log("Parameter Binding: Ready");
}

export function createBinding(state, options = {}) {
  const parameter = getParameterById(
    state,
    options.parameterId
  );

  if (!parameter) {
    throw new Error("パラメータが見つかりません");
  }

  const targetType = options.targetType || "deformer";

  if (!["deformer", "mesh"].includes(targetType)) {
    throw new Error("対応していないバインディング形式です");
  }

  const targetId = options.targetId;

  const target = targetType === "deformer"
    ? getDeformerById(state, targetId)
    : getMeshById(state, targetId);

  if (!target) {
    throw new Error("連動先が見つかりません");
  }

  const binding = {
    id: `binding_${state.bindingManager.nextId++}`,

    parameterId: parameter.id,

    targetType,
    targetId,

    property: options.property || "x",

    inputMin: options.inputMin ?? parameter.min,
    inputMax: options.inputMax ?? parameter.max,

    outputMin: options.outputMin ?? 0,
    outputMax: options.outputMax ?? 100,

    enabled: true,

    createdAt: Date.now()
  };

  state.bindings.push(binding);

  return binding;
}

export function getBindingById(state, bindingId) {
  return state.bindings.find(
    binding => binding.id === bindingId
  ) || null;
}

export function getBindingsByParameter(state, parameterId) {
  return state.bindings.filter(
    binding => binding.parameterId === parameterId
  );
}

export function getBindingsByTarget(state, targetId) {
  return state.bindings.filter(
    binding => binding.targetId === targetId
  );
}

export function removeBinding(state, bindingId) {
  const index = state.bindings.findIndex(
    binding => binding.id === bindingId
  );

  if (index === -1) {
    return false;
  }

  state.bindings.splice(index, 1);

  return true;
}

export function setBindingEnabled(state, bindingId, enabled) {
  const binding = getBindingById(state, bindingId);

  if (!binding) {
    return false;
  }

  binding.enabled = Boolean(enabled);

  return true;
}

export function setBindingRange(
  state,
  bindingId,
  inputMin,
  inputMax,
  outputMin,
  outputMax
) {
  const binding = getBindingById(state, bindingId);

  if (
    !binding ||
    ![inputMin, inputMax, outputMin, outputMax].every(
      Number.isFinite
    ) ||
    inputMin >= inputMax
  ) {
    return false;
  }

  binding.inputMin = inputMin;
  binding.inputMax = inputMax;
  binding.outputMin = outputMin;
  binding.outputMax = outputMax;

  return true;
}

export function calculateBindingValue(binding, parameterValue) {
  if (!binding || !Number.isFinite(parameterValue)) {
    return null;
  }

  const inputRange = binding.inputMax - binding.inputMin;

  if (inputRange === 0) {
    return binding.outputMin;
  }

  const ratio = Math.max(
    0,
    Math.min(
      1,
      (parameterValue - binding.inputMin) / inputRange
    )
  );

  return binding.outputMin +
    ratio * (binding.outputMax - binding.outputMin);
}

export function applyBinding(state, bindingId) {
  const binding = getBindingById(state, bindingId);

  if (!binding || !binding.enabled) {
    return false;
  }

  const parameter = getParameterById(
    state,
    binding.parameterId
  );

  if (!parameter) {
    return false;
  }

  const target = binding.targetType === "deformer"
    ? getDeformerById(state, binding.targetId)
    : getMeshById(state, binding.targetId);

  if (!target) {
    return false;
  }

  const value = calculateBindingValue(
    binding,
    parameter.value
  );

  if (value === null) {
    return false;
  }

  if (binding.targetType === "deformer") {
    if (target.locked) {
      return false;
    }

    if (!(binding.property in target)) {
      return false;
    }

    if (typeof target[binding.property] !== "number") {
      return false;
    }

    target[binding.property] = value;

    return true;
  }

  if (binding.targetType === "mesh") {
    if (!["x", "y"].includes(binding.property)) {
      return false;
    }

    if (!target.vertices.length) {
      return false;
    }

    for (const vertex of target.vertices) {
      if (!vertex.locked) {
        vertex[`original${binding.property.toUpperCase()}`] = value;
      }
    }

    return true;
  }

  return false;
}

export function applyParameterBindings(state, parameterId) {
  const bindings = getBindingsByParameter(
    state,
    parameterId
  );

  let appliedCount = 0;

  for (const binding of bindings) {
    if (applyBinding(state, binding.id)) {
      appliedCount++;
    }
  }

  return appliedCount;
}
