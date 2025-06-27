import { app, BrowserWindow } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ipcMain } from "electron";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Task storage file path
const TASKS_FILE = path.join(app.getPath("userData"), "tasks.json");

// Ensure userData directory exists and initialize tasks file
async function initializeTasksFile() {
  try {
    await fs.access(TASKS_FILE);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(TASKS_FILE, JSON.stringify([]));
  }
}

// Read tasks from file
async function readTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf8");
    console.log(data);
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading tasks:", error);
    return [];
  }
}

// Write tasks to file
async function writeTasks(tasks) {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing tasks:", error);
    return false;
  }
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("src/index.html");
};

app.whenReady().then(async () => {
  // Initialize tasks file
  await initializeTasksFile();

  ipcMain.handle("ping", () => "pong");

  // Task management handlers
  ipcMain.handle("getTasks", async () => {
    return await readTasks();
  });

  ipcMain.handle("addTask", async (event, taskText) => {
    const tasks = await readTasks();
    const newTask = {
      id: Date.now().toString(),
      text: taskText,
      recurring: false,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    const success = await writeTasks(tasks);
    return success ? newTask : null;
  });

  ipcMain.handle("deleteTask", async (event, taskId) => {
    const tasks = await readTasks();
    const filteredTasks = tasks.filter((task) => task.id !== taskId);
    return await writeTasks(filteredTasks);
  });

  ipcMain.handle("updateTaskRecurring", async (event, taskId, recurring) => {
    const tasks = await readTasks();
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].recurring = recurring;
      const success = await writeTasks(tasks);
      return success ? tasks[taskIndex] : null;
    }
    return null;
  });

  // Native Node.js print handler
  ipcMain.handle("print", async (event, content) => {
    try {
      const { stderr } = await execAsync(`echo "${content}" | lpr`);

      if (stderr) {
        console.error("Print error:", stderr);
        return false;
      }

      console.log("Print job sent successfully");
      return true;
    } catch (error) {
      console.error("Print error:", error);
      return false;
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
