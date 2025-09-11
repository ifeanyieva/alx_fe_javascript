// Load quotes from localStorage or fallback to defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The best way to predict the future is to invent it.", category: "Motivation" },
  { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Life" },
  { text: "The journey of a thousand miles begins with one step.", category: "Wisdom" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show random quote
function showRandomQuote() {
  const filter = localStorage.getItem("selectedCategory") || "all";
  let filteredQuotes = filter === "all" ? quotes : quotes.filter(q => q.category === filter);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = `<p>No quotes available in this category.</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  const displayDiv = document.getElementById("quoteDisplay");
  displayDiv.innerHTML = `
    <p>"${quote.text}"</p>
    <small><em>Category: ${quote.category}</em></small>
  `;
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  quotes.push({ text: newText, category: newCategory });
  saveQuotes();
  populateCategories(); // ✅ update dropdown

  textInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
}

// Create Add Quote form dynamically
function createAddQuoteForm() {
  const formDiv = document.createElement("div");
  formDiv.className = "add-quote-form"; // ✅ styled form

  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formDiv.appendChild(textInput);
  formDiv.appendChild(categoryInput);
  formDiv.appendChild(addButton);

  // Insert just before notifications div
  document.body.insertBefore(formDiv, document.getElementById("notifications"));
}

// Populate category dropdown
function populateCategories() {
  const select = document.getElementById("categoryFilter");
  const currentValue = select.value;

  // Clear except "All"
  select.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore previous selection or saved filter
  const savedFilter = localStorage.getItem("selectedCategory") || "all";
  select.value = savedFilter;
}

// Filter quotes
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selected);
  showRandomQuote();
}

// Export quotes as JSON
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        showNotification("Quotes imported successfully!", "success");
      } else {
        showNotification("Invalid file format. Must be an array of quotes.", "error");
      }
    } catch (error) {
      showNotification("Error reading file: " + error.message, "error");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Notifications
function showNotification(message, type = "info") {
  const notifDiv = document.getElementById("notifications");
  const alertBox = document.createElement("div");
  alertBox.className = `alert ${type}`;
  alertBox.textContent = message;
  notifDiv.appendChild(alertBox);

  setTimeout(() => alertBox.remove(), 4000);
}

// Conflict resolution box
function showConflictResolution(localQuote, serverQuote) {
  const notifDiv = document.getElementById("notifications");
  const box = document.createElement("div");
  box.className = "conflict-box";
  box.innerHTML = `
    <p><strong>Conflict detected:</strong></p>
    <p>Local: "${localQuote.text}" [${localQuote.category}]</p>
    <p>Server: "${serverQuote.text}" [${serverQuote.category}]</p>
    <button id="keepServer">Keep Server</button>
    <button id="keepLocal">Keep Local</button>
  `;

  notifDiv.appendChild(box);

  document.getElementById("keepServer").onclick = () => {
    quotes = quotes.map(q => (q.text === localQuote.text ? serverQuote : q));
    saveQuotes();
    box.remove();
    showNotification("Conflict resolved: kept server version", "success");
  };

  document.getElementById("keepLocal").onclick = () => {
    box.remove();
    showNotification("Conflict resolved: kept local version", "success");
  };
}

// Sync with server (mock)
async function syncWithServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=3");
    const serverData = await response.json();

    const serverQuotes = serverData.map(post => ({
      text: post.title,
      category: "Server"
    }));

    // Conflict detection
    serverQuotes.forEach(serverQuote => {
      const localMatch = quotes.find(q => q.text === serverQuote.text);
      if (localMatch) {
        showConflictResolution(localMatch, serverQuote);
      } else {
        quotes.push(serverQuote);
      }
    });

    saveQuotes();
    populateCategories();
    showNotification("Quotes synced with server", "info");
  } catch (error) {
    showNotification("Error syncing with server: " + error.message, "error");
  }
}

// Setup
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportQuotes);

  createAddQuoteForm();
  populateCategories();
  showRandomQuote();

  // Periodic sync every 30s
  setInterval(syncWithServer, 30000);
});