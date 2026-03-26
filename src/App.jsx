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

// paste your Apps Script web app URL between the quotes
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

  const productReport = useMemo(() => {
    const byProduct = {};
    transactions.forEach((t) => {
      if (!byProduct[t.description]) {
        byProduct[t.description] = {
          description: t.description,
          units: 0,
          revenue: 0,
          transactions: 0,
        };
      }
      byProduct[t.description].units += Number(t.quantity);
      byProduct[t.description].revenue += Number(t.totalPrice);
      byProduct[t.description].transactions += 1;
    });
    return Object.values(byProduct).sort((a, b) => b.revenue - a.revenue);
  }, [transactions]);

  const staffReport = useMemo(() => {
    const byStaff = {};
    transactions.forEach((t) => {
      if (!byStaff[t.cashier]) {
        byStaff[t.cashier] = {
          cashier: t.cashier,
          salesCount: 0,
          units: 0,
          revenue: 0,
        };
      }
      byStaff[t.cashier].salesCount += 1;
      byStaff[t.cashier].units += Number(t.quantity);
      byStaff[t.cashier].revenue += Number(t.totalPrice);
    });
    return Object.values(byStaff).sort((a, b) => b.revenue - a.revenue);
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
      if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL !== "PASTE_YOUR_GOOGLE_SCRIPT_URL_HERE") {
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
      setMessage("Transaction saved on screen, but Google Sheets failed.");
      setTransactions((prev) => [record, ...prev]);
    }
  }

async function loadSampleData() {
  const totalRecords = 100;
  const batchSize = 20;
  const allRecords = [];

  for (let i = 0; i < totalRecords; i++) {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    const qty = Math.floor(Math.random() * 5) + 1;
    const staff = STAFF[Math.floor(Math.random() * STAFF.length)];

    const now = new Date();

    // random day in the last 7 days
    const daysback = Math.floor(Math.random() * 7);
    now.setDate(now.getDate() - daysBack);

    //random business hour
    now.setHours(8 + Math.floor(Math.random() * 10));
    now.setMinutes(Math.floor(Math.random() * 60));
    now.setSeconds(Math.floor(Math.random() * 60));

    const record = {
      transactionId: `SEED-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`,
      date: todayString(now),
      time: timeString(now),
      cashier: staff,
      customerName: "Walk-in Customer",
      itemCode: item.itemCode,
      itemNumber: item.itemNumber,
      description: item.description,
      unitPrice: item.price,
      quantity: qty,
      totalPrice: item.price * qty,
    };

    demo.push(record);
  }

  try {
    await Promise.all(
      demo.map((record) =>
        fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify(record),
        })
      )
    );

    setTransactions((prev) => [...demo.reverse(), ...prev]);
    setMessage("Sample transactions sent to Google Sheets successfully.");
  } catch (error) {
    console.error(error);
    setMessage("Failed to send sample transactions to Google Sheets.");
  }
}

  return (
    <div className="app">
      <h1>Sweet Treats Pastry Shop POS & MIS System</h1>

      <div className="grid">
        <div className="card">
          <h2>Data Entry Screen</h2>

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

          <label>Select Item</label>
          <select
            value={selectedItemCode}
            onChange={(e) => setSelectedItemCode(e.target.value)}
          >
            {ITEMS.map((item) => (
              <option key={item.itemCode} value={item.itemCode}>
                {item.description} - {formatMoney(item.price)}
              </option>
            ))}
          </select>

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

          <div className="button-row">
            <button onClick={submitTransaction}>Submit Transaction</button>
            <button onClick={loadSampleData}>Load Sample Data</button>
          </div>

          {message && <p>{message}</p>}
        </div>

        <div className="card">
          <h2>Daily Productivity</h2>
          <p>Transactions Today: {dailySummary.transactions}</p>
          <p>Units Sold Today: {dailySummary.units}</p>
          <p>Revenue Today: {formatMoney(dailySummary.revenue)}</p>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>MIS Product Performance Report</h2>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Units Sold</th>
                <th>Transactions</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productReport.length ? (
                productReport.map((row) => (
                  <tr key={row.description}>
                    <td>{row.description}</td>
                    <td>{row.units}</td>
                    <td>{row.transactions}</td>
                    <td>{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>MIS Staff Performance Report</h2>
          <table>
            <thead>
              <tr>
                <th>Cashier</th>
                <th>Sales Count</th>
                <th>Units</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {staffReport.length ? (
                staffReport.map((row) => (
                  <tr key={row.cashier}>
                    <td>{row.cashier}</td>
                    <td>{row.salesCount}</td>
                    <td>{row.units}</td>
                    <td>{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
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
              <th>Item Code</th>
              <th>Description</th>
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
                  <td>{t.itemCode}</td>
                  <td>{t.description}</td>
                  <td>{t.quantity}</td>
                  <td>{formatMoney(t.totalPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">No transactions submitted yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}