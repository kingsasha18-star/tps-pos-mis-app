import React, { useMemo, useState } from "react";
import "./App.css";

const ITEMS = [
  { itemCode: "PST001", itemNumber: "1001", description: "Sweet Bread", price: 700 },
  { itemCode: "PST002", itemNumber: "1002", description: "Cheese Roll", price: 300 },
  { itemCode: "PST003", itemNumber: "1003", description: "Pine Tart", price: 250 },
  { itemCode: "PST004", itemNumber: "1004", description: "Chicken Patty", price: 400 },
  { itemCode: "PST005", itemNumber: "1005", description: "Black Cake Slice", price: 800 },
  { itemCode: "PST006", itemNumber: "1006", description: "Croissant", price: 500 },
];

const STAFF = ["Sasha King", "Keira Scultz", "Kurchella Atwell", "Arlene Smith"];
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqkfGl2fB6q005DpO1EAnQkTYgN17LWhoeQBKmEXkDhKe1rf4YOJbuYYO5zf9Rv1f5Xg/exec";

function todayString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function timeString(date = new Date()) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function App() {
  const [selectedItemCode, setSelectedItemCode] = useState(ITEMS[0].itemCode);
  const [quantity, setQuantity] = useState(1);
  const [cashier, setCashier] = useState(STAFF[0]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [transactions, setTransactions] = useState([]);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(
    () => ITEMS.find((i) => i.itemCode === selectedItemCode),
    [selectedItemCode]
  );

  const totalPrice = (selectedItem?.price || 0) * (Number(quantity) || 0);

  const dailySummary = useMemo(() => {
    const today = todayString();
    const todays = transactions.filter((t) => t.date === today);
    return {
      transactions: todays.length,
      units: todays.reduce((sum, t) => sum + Number(t.quantity), 0),
      revenue: todays.reduce((sum, t) => sum + Number(t.totalPrice), 0),
    };
  }, [transactions]);

  async function submitTransaction() {
    setMessage("");

    if (!selectedItem || Number(quantity) < 1) {
      setMessage("Please select a valid item and quantity.");
      return;
    }

    const now = new Date();
    const record = {
      transactionId: `TXN-${Date.now()}`,
      date: todayString(now),
      time: timeString(now),
      cashier,
      customerName,
      itemCode: selectedItem.itemCode,
      itemNumber: selectedItem.itemNumber,
      description: selectedItem.description,
      unitPrice: selectedItem.price,
      quantity: Number(quantity),
      totalPrice,
    };

    try {
      if (
        GOOGLE_SCRIPT_URL &&
        GOOGLE_SCRIPT_URL !== "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE"
      ) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(record),
        });
      }

      setTransactions((prev) => [record, ...prev]);
      setQuantity(1);
      setCustomerName("Walk-in Customer");
      setMessage("Transaction submitted successfully.");
    } catch (error) {
      console.error(error);
      setTransactions((prev) => [record, ...prev]);
      setMessage("Transaction saved on screen, but Google Sheets failed.");
    }
  }

  return (
    <div className="app">
      <h1>The Pastry Shop POS & MIS System</h1>

      <div className="card">
        <h2>Select a Pastry</h2>
        <div className="pastry-grid">
          {ITEMS.map((item) => (
            <div
              key={item.itemCode}
              className={`pastry-card ${
                selectedItemCode === item.itemCode ? "selected-card" : ""
              }`}
              onClick={() => setSelectedItemCode(item.itemCode)}
            >
              <h3>{item.description}</h3>
              <p>{formatMoney(item.price)}</p>
              <small>Code: {item.itemCode}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Data Entry Screen</h2>

          <label>Selected Pastry</label>
          <input value={selectedItem?.description || ""} readOnly />

          <label>Cashier</label>
          <select value={cashier} onChange={(e) => setCashier(e.target.value)}>
            {STAFF.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label>Customer Name</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <label>Item Code</label>
          <input value={selectedItem?.itemCode || ""} readOnly />

          <label>Item Number</label>
          <input value={selectedItem?.itemNumber || ""} readOnly />

          <label>Unit Price</label>
          <input value={formatMoney(selectedItem?.price || 0)} readOnly />

          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <div className="total-box">
            <strong>Current Total: {formatMoney(totalPrice)}</strong>
            <div>
              {todayString()} {timeString()}
            </div>
          </div>

          <button onClick={submitTransaction}>Submit Transaction</button>

          {message && <p>{message}</p>}
        </div>

        <div className="card">
          <h2>Daily Productivity</h2>
          <p>Transactions Today: {dailySummary.transactions}</p>
          <p>Units Sold Today: {dailySummary.units}</p>
          <p>Revenue Today: {formatMoney(dailySummary.revenue)}</p>
        </div>
      </div>

      <div className="card">
        <h2>Recent Transactions</h2>
        <table>
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Cashier</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length ? (
              transactions.slice(0, 12).map((t) => (
                <tr key={t.transactionId}>
                  <td>{t.transactionId}</td>
                  <td>{t.date}</td>
                  <td>{t.time}</td>
                  <td>{t.cashier}</td>
                  <td>{t.description}</td>
                  <td>{t.quantity}</td>
                  <td>{formatMoney(t.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No transactions submitted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
