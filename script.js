// Get HTML elements
const form = document.getElementById("transaction-form");

const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceDisplay = document.getElementById("balance");
const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const transactionList = document.getElementById("transaction-list");
const transactionCount = document.getElementById("transaction-count");
const flowIncomeDisplay = document.getElementById("flow-income");
const flowExpenseDisplay = document.getElementById("flow-expense");
const flowRateDisplay = document.getElementById("flow-rate");
const incomeBar = document.getElementById("income-bar");
const expenseBar = document.getElementById("expense-bar");
const expenseChart = document.getElementById("expense-chart");
const chartTotal = document.getElementById("chart-total");
const categoryLegend = document.getElementById("category-legend");
const categoryColors = {
    Salary: "#6757e8",
    Food: "#f28e5b",
    Travel: "#3b9c9b",
    Shopping: "#e46c91",
    Education: "#e0b84c",
    Other: "#8290a7"
};

// Store transactions
let transactions = [];
let pendingTransactionAnimationId = null;

// Handle form submission
form.addEventListener("submit", function(event) {

    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;

    if (!description || !Number.isFinite(amount) || amount <= 0) {
        alert("Please enter valid transaction details.");
        return;
    }

    // Create transaction object
    const transaction = {
        id: Date.now(),
        description: description,
        amount: amount,
        type: type,
        category: category
    };

    // Add transaction to array
    transactions.push(transaction);
    pendingTransactionAnimationId = transaction.id;

    // Update dashboard
    updateDashboard();
    pendingTransactionAnimationId = null;

    // Clear form
    form.reset();

});

// Update dashboard
function updateDashboard() {

    let totalIncome = 0;
    let totalExpense = 0;
    const expensesByCategory = new Map();

    transactionList.innerHTML = "";

    transactions.forEach(function(transaction) {

        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
            const categoryTotal = expensesByCategory.get(transaction.category) || 0;
            expensesByCategory.set(transaction.category, categoryTotal + transaction.amount);
        }

        const sign = transaction.type === "income" ? "+" : "-";
        const li = document.createElement("li");
        const details = document.createElement("span");
        const description = document.createElement("span");
        const category = document.createElement("small");
        const amount = document.createElement("span");
        const deleteButton = document.createElement("button");

        if (transaction.id === pendingTransactionAnimationId) {
            li.classList.add("transaction-enter");
        }

        description.textContent = transaction.description;
        category.textContent = transaction.category;
        details.append(description, category);
        amount.className = `transaction-amount ${transaction.type}`;
        amount.textContent = `${sign} ₹${transaction.amount.toFixed(2)}`;
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function() {
            deleteTransaction(transaction.id);
        });

        li.append(details, amount, deleteButton);
        transactionList.appendChild(li);

    });

    // Calculate balance
    const balance = totalIncome - totalExpense;

    // Update HTML
    balanceDisplay.textContent = "₹" + balance.toFixed(2);
    incomeDisplay.textContent = "₹" + totalIncome.toFixed(2);
    expenseDisplay.textContent = "₹" + totalExpense.toFixed(2);
    flowIncomeDisplay.textContent = "₹" + totalIncome.toFixed(2);
    flowExpenseDisplay.textContent = "₹" + totalExpense.toFixed(2);

    const largestTotal = Math.max(totalIncome, totalExpense);
    incomeBar.style.width = largestTotal ? `${(totalIncome / largestTotal) * 100}%` : "0%";
    expenseBar.style.width = largestTotal ? `${(totalExpense / largestTotal) * 100}%` : "0%";

    if (totalIncome > 0) {
        const spendingRate = Math.round((totalExpense / totalIncome) * 100);
        flowRateDisplay.textContent = `${spendingRate}% of income spent`;
        flowRateDisplay.classList.toggle("over-budget", spendingRate > 100);
    } else {
        flowRateDisplay.textContent = totalExpense ? "No income recorded" : "No activity yet";
        flowRateDisplay.classList.remove("over-budget");
    }

    transactionCount.textContent = `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`;

    updateExpenseBreakdown(expensesByCategory, totalExpense);

    [balanceDisplay, incomeDisplay, expenseDisplay, flowIncomeDisplay, flowExpenseDisplay, chartTotal]
        .forEach(playValueAnimation);

}

function playValueAnimation(element) {
    element.classList.remove("value-updated");
    void element.offsetWidth;
    element.classList.add("value-updated");
}

function updateExpenseBreakdown(expensesByCategory, totalExpense) {

    chartTotal.textContent = "₹" + totalExpense.toFixed(2);
    categoryLegend.replaceChildren();

    if (totalExpense === 0) {
        expenseChart.classList.add("no-data");
        expenseChart.style.background = "";
        expenseChart.setAttribute("aria-label", "No expenses to display");

        const emptyMessage = document.createElement("li");
        emptyMessage.className = "legend-empty";
        emptyMessage.textContent = "Add an expense to see your breakdown.";
        categoryLegend.appendChild(emptyMessage);
        return;
    }

    expenseChart.classList.remove("no-data");
    let currentAngle = 0;
    const chartSegments = [];
    const chartDescription = [];

    expensesByCategory.forEach(function(amount, category) {
        const color = categoryColors[category] || categoryColors.Other;
        const nextAngle = currentAngle + (amount / totalExpense) * 360;
        const percentage = Math.round((amount / totalExpense) * 100);
        const legendItem = document.createElement("li");
        const swatch = document.createElement("span");
        const categoryLabel = document.createElement("span");
        const amountLabel = document.createElement("span");

        swatch.className = "legend-swatch";
        swatch.style.backgroundColor = color;
        categoryLabel.className = "legend-category";
        categoryLabel.textContent = `${category} · ${percentage}%`;
        amountLabel.className = "legend-amount";
        amountLabel.textContent = "₹" + amount.toFixed(2);
        legendItem.append(swatch, categoryLabel, amountLabel);
        categoryLegend.appendChild(legendItem);

        chartSegments.push(`${color} ${currentAngle}deg ${nextAngle}deg`);
        chartDescription.push(`${category}: ₹${amount.toFixed(2)}, ${percentage}%`);
        currentAngle = nextAngle;
    });

    expenseChart.style.background = `conic-gradient(${chartSegments.join(", ")})`;
    expenseChart.setAttribute("aria-label", `Expenses by category. ${chartDescription.join(". ")}`);
    expenseChart.classList.remove("chart-updated");
    void expenseChart.offsetWidth;
    expenseChart.classList.add("chart-updated");

}

// Delete transaction
function deleteTransaction(id) {

    transactions = transactions.filter(function(transaction) {
        return transaction.id !== id;
    });

    updateDashboard();

}