const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  ping: () => ipcRenderer.invoke("ping"),
  // we can also expose variables, not just functions
});

// Expose print functionality and task management
contextBridge.exposeInMainWorld("electronAPI", {
  print: (options) => ipcRenderer.invoke("print", options),
  getTasks: () => ipcRenderer.invoke("getTasks"),
  addTask: (taskText) => ipcRenderer.invoke("addTask", taskText),
  deleteTask: (taskId) => ipcRenderer.invoke("deleteTask", taskId),
  updateTaskRecurring: (taskId, recurring) =>
    ipcRenderer.invoke("updateTaskRecurring", taskId, recurring),
});
