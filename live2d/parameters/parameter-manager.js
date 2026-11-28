
export function initializeParameterManager(state) {
  if (!Array.isArray(state.parameters)) {
    state.parameters = [];
  }

  state.parameterManager = {
    nextId: 1,
    selectedParameterId: null
  };

  console.log("Parameter Manager: Ready");
}

export function createParameter(state, options = {}) {
  const parameter = {
    id: options.id || `parameter_${state.parameterManager.nextId++}`,
    name: options.name || "新しいパラメータ",

    value: options.value ?? 0,
    defaultValue: options.defaultValue ?? 0,

    min: options.min ?? -1,
    max: options.max ?? 1,

    step: options.step ?? 0.01,

    visible: true,
    locked: false,

    createdAt: Date.now()
  };

  if (
    !Number.isFinite(parameter.min) ||
    !Number.isFinite(parameter.max) ||
    parameter.min >= parameter.max
  ) {
    throw new Error("パラメータの最小値と最大値が正しくありません");
  }

  parameter.defaultValue = clamp(
    parameter.defaultValue,
    parameter.min,
    parameter.max
  );

  parameter.value = clamp(
    parameter.value,
    parameter.min,
    parameter.max
  );

  state.parameters.push(parameter);

  selectParameter(state, parameter.id);

  return parameter;
}

export function getParameterById(state, parameterId) {
  return state.parameters.find(
    parameter => parameter.id === parameterId
  ) || null;
}

export function getAllParameters(state) {
  return [...state.parameters];
}

export function getSelectedParameter(state) {
  return getParameterById(
    state,
    state.parameterManager.selectedParameterId
  );
}

export function selectParameter(state, parameterId) {
  const parameter = getParameterById(state, parameterId);

  if (!parameter) {
    return false;
  }

  state.parameterManager.selectedParameterId = parameterId;

  return true;
}

export function removeParameter(state, parameterId) {
  const index = state.parameters.findIndex(
    parameter => parameter.id === parameterId
  );

  if (index === -1) {
    return false;
  }

  state.parameters.splice(index, 1);

  if (state.parameterManager.selectedParameterId === parameterId) {
    state.parameterManager.selectedParameterId =
      state.parameters[0]?.id || null;
  }

  return true;
}

export function setParameterValue(state, parameterId, value) {
  const parameter = getParameterById(state, parameterId);

  if (
    !parameter ||
    parameter.locked ||
    !Number.isFinite(value)
  ) {
    return false;
  }

  parameter.value = clamp(
    value,
    parameter.min,
    parameter.max
  );

  return true;
}

export function setParameterRange(
  state,
  parameterId,
  min,
  max
) {
  const parameter = getParameterById(state, parameterId);

  if (
    !parameter ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min >= max
  ) {
    return false;
  }

  parameter.min = min;
  parameter.max = max;

  parameter.value = clamp(
    parameter.value,
    min,
    max
  );

  parameter.defaultValue = clamp(
    parameter.defaultValue,
    min,
    max
  );

  return true;
}

export function resetParameter(state, parameterId) {
  const parameter = getParameterById(state, parameterId);

  if (!parameter || parameter.locked) {
    return false;
  }

  parameter.value = parameter.defaultValue;

  return true;
}

export function resetAllParameters(state) {
  for (const parameter of state.parameters) {
    if (!parameter.locked) {
      parameter.value = parameter.defaultValue;
    }
  }
}

export function renameParameter(state, parameterId, newName) {
  const parameter = getParameterById(state, parameterId);

  if (!parameter || typeof newName !== "string") {
    return false;
  }

  const name = newName.trim();

  if (!name) {
    return false;
  }

  parameter.name = name;

  return true;
}

export function getNormalizedParameterValue(parameter) {
  if (!parameter) {
    return 0;
  }

  return (
    (parameter.value - parameter.min) /
    (parameter.max - parameter.min)
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
