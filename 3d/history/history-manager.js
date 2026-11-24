
export function createHistoryManager(limit = 100) {
  const undoStack = [];
  const redoStack = [];

  function isValidCommand(command) {
    return (
      command &&
      typeof command.undo === "function" &&
      typeof command.redo === "function"
    );
  }

  function execute(command) {
    if (!isValidCommand(command)) {
      throw new Error("無効な履歴コマンドです");
    }

    // 実行に成功した場合だけ履歴に保存
    command.redo();

    undoStack.push(command);
    redoStack.length = 0;

    if (undoStack.length > limit) {
      undoStack.shift();
    }

    return true;
  }

  function undo() {
    if (undoStack.length === 0) return false;

    const command = undoStack[undoStack.length - 1];

    command.undo();

    undoStack.pop();
    redoStack.push(command);

    return true;
  }

  function redo() {
    if (redoStack.length === 0) return false;

    const command = redoStack[redoStack.length - 1];

    command.redo();

    redoStack.pop();
    undoStack.push(command);

    if (undoStack.length > limit) {
      undoStack.shift();
    }

    return true;
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return {
    execute,
    undo,
    redo,
    clear,

    get canUndo() {
      return undoStack.length > 0;
    },

    get canRedo() {
      return redoStack.length > 0;
    },

    get undoCount() {
      return undoStack.length;
    },

    get redoCount() {
      return redoStack.length;
    }
  };
}
