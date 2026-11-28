
import {
  setParameterValue,
  resetParameter,
  resetAllParameters
} from "./parameter-manager.js";

import {
  applyParameterBindings
} from "./parameter-binding.js";

export function initializeParameterUI(state) {
  state.parameterUI = {
    container: document.getElementById("parameterList"),
    controls: new Map()
  };

  if (!state.parameterUI.container) {
    console.warn("Parameter UI container was not found.");
    return false;
  }

  renderParameterUI(state);

  console.log("Parameter UI: Ready");

  return true;
}

export function renderParameterUI(state) {
  const container = state.parameterUI?.container;

  if (!container) {
    return;
  }

  container.replaceChildren();
  state.parameterUI.controls.clear();

  if (state.parameters.length === 0) {
    const empty = document.createElement("div");

    empty.className = "empty-message";
    empty.textContent = "パラメータがありません";

    container.appendChild(empty);
    return;
  }

  for (const parameter of state.parameters) {
    const item = document.createElement("div");

    item.className = "parameter-item";

    const header = document.createElement("div");
    header.className = "parameter-header";

    const name = document.createElement("span");
    name.className = "parameter-name";
    name.textContent = parameter.name;

    const value = document.createElement("span");
    value.className = "parameter-value";

    value.textContent = formatValue(parameter.value);

    const slider = document.createElement("input");

    slider.type = "range";
    slider.className = "parameter-slider";
    slider.min = String(parameter.min);
    slider.max = String(parameter.max);
    slider.step = String(parameter.step);
    slider.value = String(parameter.value);
    slider.disabled = parameter.locked;

    slider.addEventListener("input", () => {
      const nextValue = Number(slider.value);

      if (
        setParameterValue(
          state,
          parameter.id,
          nextValue
        )
      ) {
        value.textContent = formatValue(
          parameter.value
        );

        applyParameterBindings(
          state,
          parameter.id
        );

        state.requestRender?.();
      }
    });

    const resetButton = document.createElement("button");

    resetButton.type = "button";
    resetButton.className = "parameter-reset";
    resetButton.textContent = "↺";
    resetButton.title = "初期値に戻す";
    resetButton.disabled = parameter.locked;

    resetButton.addEventListener("click", () => {
      if (resetParameter(state, parameter.id)) {
        slider.value = String(parameter.value);
        value.textContent = formatValue(
          parameter.value
        );

        applyParameterBindings(
          state,
          parameter.id
        );

        state.requestRender?.();
      }
    });

    header.append(name, value);
    item.append(header, slider, resetButton);

    container.appendChild(item);

    state.parameterUI.controls.set(parameter.id, {
      slider,
      value,
      resetButton
    });
  }
}

export function updateParameterUI(state, parameterId) {
  const parameter = state.parameters.find(
    item => item.id === parameterId
  );

  const controls = state.parameterUI?.controls.get(
    parameterId
  );

  if (!parameter || !controls) {
    return false;
  }

  controls.slider.value = String(parameter.value);
  controls.value.textContent = formatValue(
    parameter.value
  );

  controls.slider.disabled = parameter.locked;
  controls.resetButton.disabled = parameter.locked;

  return true;
}

export function resetParameterUI(state) {
  resetAllParameters(state);

  for (const parameter of state.parameters) {
    updateParameterUI(state, parameter.id);

    applyParameterBindings(
      state,
      parameter.id
    );
  }

  state.requestRender?.();
}

function formatValue(value) {
  return Number(value).toFixed(2);
}
