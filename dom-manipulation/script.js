// Quotes array with objects
const quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Don't let yesterday take up too much of today.", category: "Inspiration" },
  { text: "It's not whether you get knocked down, it's whether you get up.", category: "Perseverance" }
];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteButton = document.getElementById("newQuote");

// Function to show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  quoteDisplay.innerHTML = `<p>${quote.text}</p><small>Category: ${quote.category}</small>`;
}

// Function to add a new quote from the form
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const newText = textInput.value.trim();
  const newCategory = categoryInput.value.trim();

  if (newText === "" || newCategory === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  // Add to quotes array
  const newQuote = { text: newText, category: newCategory };
  quotes.push(newQuote);

  // Immediately show the new quote
  quoteDisplay.innerHTML = `<p>${newQuote.text}</p><small>Category: ${newQuote.category}</small>`;

  // Clear inputs
  textInput.value = "";
  categoryInput.value = "";

  alert("Quote added successfully!");
}

// Show a random quote when the page loads
showRandomQuote();

// Event listener for "Show New Quote" button
newQuoteButton.addEventListener("click", showRandomQuote);