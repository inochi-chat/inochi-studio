
export const PARAMETER_PRESETS = [
  {
    id: "ParamAngleX",
    name: "顔の左右",
    min: -30,
    max: 30,
    defaultValue: 0,
    step: 0.1
  },
  {
    id: "ParamAngleY",
    name: "顔の上下",
    min: -30,
    max: 30,
    defaultValue: 0,
    step: 0.1
  },
  {
    id: "ParamAngleZ",
    name: "顔の傾き",
    min: -30,
    max: 30,
    defaultValue: 0,
    step: 0.1
  },
  {
    id: "ParamEyeLOpen",
    name: "左目の開閉",
    min: 0,
    max: 1,
    defaultValue: 1,
    step: 0.01
  },
  {
    id: "ParamEyeROpen",
    name: "右目の開閉",
    min: 0,
    max: 1,
    defaultValue: 1,
    step: 0.01
  },
  {
    id: "ParamMouthOpenY",
    name: "口の開閉",
    min: 0,
    max: 1,
    defaultValue: 0,
    step: 0.01
  },
  {
    id: "ParamMouthForm",
    name: "口の形",
    min: -1,
    max: 1,
    defaultValue: 0,
    step: 0.01
  },
  {
    id: "ParamBrowLY",
    name: "左眉の上下",
    min: -1,
    max: 1,
    defaultValue: 0,
    step: 0.01
  },
  {
    id: "ParamBrowRY",
    name: "右眉の上下",
    min: -1,
    max: 1,
    defaultValue: 0,
    step: 0.01
  },
  {
    id: "ParamBodyAngleX",
    name: "体の左右",
    min: -10,
    max: 10,
    defaultValue: 0,
    step: 0.1
  }
];

export function getParameterPreset(presetId) {
  return PARAMETER_PRESETS.find(
    preset => preset.id === presetId
  ) || null;
}

export function getAllParameterPresets() {
  return PARAMETER_PRESETS.map(
    preset => ({ ...preset })
  );
}

export function createParameterFromPreset(state, presetId) {
  const preset = getParameterPreset(presetId);

  if (!preset) {
    return null;
  }

  const existing = state.parameters.find(
    parameter => parameter.id === preset.id
  );

  if (existing) {
    return existing;
  }

  const parameter = {
    id: preset.id,
    name: preset.name,
    value: preset.defaultValue,
    defaultValue: preset.defaultValue,
    min: preset.min,
    max: preset.max,
    step: preset.step,
    visible: true,
    locked: false,
    createdAt: Date.now()
  };

  state.parameters.push(parameter);

  return parameter;
}

export function createAllDefaultParameters(state) {
  const created = [];

  for (const preset of PARAMETER_PRESETS) {
    const parameter = createParameterFromPreset(
      state,
      preset.id
    );

    if (parameter) {
      created.push(parameter);
    }
  }

  return created;
}
