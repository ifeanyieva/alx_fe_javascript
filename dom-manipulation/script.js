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

// Function to display a random quote based on current filter
function showRandomQuote() {
  const categoryFilter = document.getElementById("categoryFilter").value;

  let filteredQuotes =
    categoryFilter === "all"
      ? quotes
      : quotes.filter(q => q.category === categoryFilter);

  if (filteredQuotes.length === 0) {
    document.getElementById("quoteDisplay").innerHTML =
      `<p>No quotes available in this category.</p>`;
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];

  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${quote.text}"</p>
    <small><em>Category: ${quote.category}</em></small>
  `;
}

// Function to add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category!");
    return;
  }

  // Add new quote
  quotes.push({ text: newText, category: newCategory });

  // Save to localStorage
  saveQuotes();

  // Update dropdown categories
  populateCategories();

  // Keep the new category selected & persist it
  document.getElementById("categoryFilter").value = newCategory;
  localStorage.setItem("selectedCategory", newCategory);

  // Clear inputs
  textInput.value = "";
  categoryInput.value = "";

  alert("New quote added successfully!");
}

// Function to dynamically create the Add Quote form
function createAddQuoteForm() {
  const formDiv = document.createElement("div");

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

  document.body.appendChild(formDiv);
}

// Function to export quotes to JSON file
function exportQuotes() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json"; // Filename
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Function to import quotes from uploaded JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert("Quotes imported successfully!");
      } else {
        alert("Invalid file format. Please upload a JSON file with an array of quotes.");
      }
    } catch (error) {
      alert("Error reading file: " + error.message);
    }
  };

  fileReader.readAsText(event.target.files[0]);
}

// Populate categories in the dropdown and restore last selected filter
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");

  // Reset dropdown
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Extract unique categories
  const categories = [...new Set(quotes.map(q => q.category))];

  // Add them as options
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  // Restore last selected filter
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory && (savedCategory === "all" || categories.includes(savedCategory))) {
    categoryFilter.value = savedCategory;
  }
}

// Handle filter change
function filterQuotes() {
  const categoryFilter = document.getElementById("categoryFilter").value;

  // Save selected filter to localStorage
  localStorage.setItem("selectedCategory", categoryFilter);

  // Show filtered random quote
  showRandomQuote();
}

// Setup event listeners after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  document.getElementById("exportQuotes").addEventListener("click", exportQuotes);

  populateCategories();  // build dropdown
  createAddQuoteForm();  // create form dynamically
  showRandomQuote();     // show a quote immediately
});