
export function createMeshSculptController({
  getOperations,
  getHistory,
  isEditing,
  isEnabled,
  getRadius,
  getStrength,
  getMode,
  onStrokeEnd = () => {}
}) {
  let strokeSaved = false;
  let strokeChanged = false;
  let previousPoint = null;

  function resetStroke() {
    strokeSaved = false;
    strokeChanged = false;
    previousPoint = null;
  }

  function saveHistoryOnce() {
    if (strokeSaved) return;

    getHistory()?.save();
    strokeSaved = true;
  }

  function isValidPoint(point) {
    return (
      point &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y) &&
      Number.isFinite(point.z)
    );
  }

  function applyStroke(stroke) {
    if (!isEditing() || !isEnabled()) return;

    const point = stroke.point;

    if (!isValidPoint(point)) return;

    const radius = Number(getRadius());
    const strength = Number(getStrength());

    if (
      !Number.isFinite(radius) ||
      radius <= 0 ||
      !Number.isFinite(strength)
    ) {
      return;
    }

    const operations = getOperations();
    if (!operations) return;

    const mode = stroke.mode || getMode();

    saveHistoryOnce();

    // Grabブラシ
    if (mode === "grab") {
      if (!previousPoint) {
        previousPoint = point.clone();
        return;
      }

      const delta = point.clone().sub(previousPoint);
      previousPoint = point.clone();

      if (delta.lengthSq() < 0.00000001) return;

      const success = operations.grabAt(
        point,
        delta,
        radius,
        strength
      );

      if (success) {
        strokeChanged = true;
      }

      return;
    }

    // 通常のスカルプト
    const success = operations.sculptAt(
      point,
      radius,
      strength,
      mode
    );

    if (success) {
      strokeChanged = true;
    }
  }

  function handleStroke(stroke) {
    if (!stroke) return;

    if (stroke.phase === "start") {
      resetStroke();
      applyStroke(stroke);
      return;
    }

    if (stroke.phase === "move") {
      applyStroke(stroke);
      return;
    }

    if (
      stroke.phase === "end" ||
      stroke.phase === "cancel"
    ) {
      const changed = strokeChanged;

      resetStroke();
      onStrokeEnd(changed);
    }
  }

  return {
    handleStroke,
    resetStroke,

    hasChanged() {
      return strokeChanged;
    }
  };
}
