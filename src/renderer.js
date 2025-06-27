// Task management state
let tasks = [];

// DOM elements
const taskInput = document.getElementById("task-input");
const addButton = document.getElementById("add-button");
const tasksContainer = document.getElementById("tasks-container");
const taskCount = document.getElementById("task-count");
const printButton = document.getElementById("print-button");

// Load tasks on app startup
async function loadTasks() {
  try {
    tasks = await window.electronAPI.getTasks();
    // Ensure all tasks have the recurring property
    tasks = tasks.map((task) => ({
      ...task,
      recurring: task.recurring !== undefined ? task.recurring : false,
    }));
    renderTasks();
    updateTaskCount();
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
}

// Render tasks in the UI
function renderTasks() {
  if (tasks.length === 0) {
    tasksContainer.innerHTML = `
      <div class="empty-state">
        <h3>No tasks yet</h3>
        <p>Add your first task to get started!</p>
      </div>
    `;
    return;
  }

  tasksContainer.innerHTML = tasks
    .map(
      (task) => `
    <div class="task-card" data-task-id="${task.id}">
      <div class="task-content">
        <label class="recurring-checkbox">
          <input type="checkbox" ${
            task.recurring ? "checked" : ""
          } onchange="updateTaskRecurring('${task.id}', this.checked)">
          <span class="checkmark"></span>
          <span class="recurring-label">Recurring</span>
        </label>
        <div class="task-text">${escapeHtml(task.text)}</div>
      </div>
      <button class="delete-button" onclick="deleteTask('${
        task.id
      }')">Delete</button>
    </div>
  `
    )
    .join("");
}

// Update task count display
function updateTaskCount() {
  const count = tasks.length;
  if (count === 0) {
    taskCount.textContent = "No tasks yet";
  } else if (count === 1) {
    taskCount.textContent = "1 task";
  } else {
    taskCount.textContent = `${count} tasks`;
  }
}

// Add a new task
async function addTask() {
  const taskText = taskInput.value.trim();

  if (!taskText) {
    return;
  }

  try {
    const newTask = await window.electronAPI.addTask(taskText);
    if (newTask) {
      tasks.push(newTask);
      renderTasks();
      updateTaskCount();
      taskInput.value = "";
      taskInput.focus();
    } else {
      alert("Failed to add task. Please try again.");
    }
  } catch (error) {
    console.error("Error adding task:", error);
    alert("Error adding task. Please try again.");
  }
}

// Delete a task
async function deleteTask(taskId) {
  try {
    const success = await window.electronAPI.deleteTask(taskId);
    if (success) {
      tasks = tasks.filter((task) => task.id !== taskId);
      renderTasks();
      updateTaskCount();
    } else {
      alert("Failed to delete task. Please try again.");
    }
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Error deleting task. Please try again.");
  }
}

// Update task recurring status
async function updateTaskRecurring(taskId, recurring) {
  try {
    const updatedTask = await window.electronAPI.updateTaskRecurring(
      taskId,
      recurring
    );
    if (updatedTask) {
      const taskIndex = tasks.findIndex((task) => task.id === taskId);
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask;
      }
    } else {
      alert("Failed to update task. Please try again.");
    }
  } catch (error) {
    console.error("Error updating task recurring status:", error);
    alert("Error updating task. Please try again.");
  }
}

// Print task list
async function printTaskList() {
  try {
    const copyLength = tasks.length;
    if (tasks.length === 0) {
      alert("No tasks to print!");
      return;
    }

    // Print each task on a separate ticket - iterate backwards to avoid skipping when deleting
    for (let i = tasks.length - 1; i >= 0; i--) {
      const task = tasks[i];
      const taskNumber = tasks.length - i; // Adjust task number for reverse iteration

      const printContent = `${task.text}`;

      // const success = true;
      const success = await window.electronAPI.print(printContent);
      if (success) {
        if (!task.recurring) {
          await deleteTask(task.id);
        }

        // Update the task count
        updateTaskCount();
      }

      if (!success) {
        console.log(`Failed to print task ${taskNumber}`);
        alert(`Failed to print task ${taskNumber}. Stopping print job.`);
        return;
      }

      // Add a small delay between prints to ensure proper separation
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // This also avoids the small receipt issue
    window.electronAPI.print(
      `Hello you,\n${copyLength} things to do today.\nLet's do it`
    );

    console.log("All tasks printed successfully");
  } catch (error) {
    console.error("Error printing task list:", error);
    alert("Error printing task list. Please try again.");
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Load existing tasks
  loadTasks();

  // Add task button click
  addButton.addEventListener("click", addTask);

  // Add task on Enter key
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  // Print button click
  printButton.addEventListener("click", printTaskList);

  // Focus on input field
  taskInput.focus();
});

// Make deleteTask function globally available for onclick handlers
window.deleteTask = deleteTask;
window.updateTaskRecurring = updateTaskRecurring;
