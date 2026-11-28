
import { createObjectSelection } from "../selection/object-selection.js";
import { createMultiSelection } from "../selection/multi-selection.js";
import { createMultiSelectionVisual } from "../selection/multi-selection-visual.js";
import { createMultiSelectionController } from "../selection/multi-selection-controller.js";
import { createMultiSelectionMode } from "../selection/multi-selection-mode.js";

export function createSelectionSystem({
  objectManager,
  objectLock,
  onChange
}) {
  const multiSelection = createMultiSelection();
  const visual = createMultiSelectionVisual();
  const mode = createMultiSelectionMode();

  const controller = createMultiSelectionController({
    multiSelection,
    visual,
    objectManager,
    objectLock,
    onChange
  });

  function createObjectPicker({
    camera,
    renderer,
    transform,
    onSelect,
    isEnabled
  }) {
    return createObjectSelection({
      camera,
      renderer,
      objectManager,
      transform,
      objectLock,
      onSelect,
      multiSelectionController: controller,
      multiSelectionMode: mode,
      isEnabled
    });
  }

  return {
    multiSelection,
    visual,
    mode,
    controller,
    createObjectPicker
  };
}
