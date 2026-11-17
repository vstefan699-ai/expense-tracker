import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useAddTransaction } from "../../hooks/useAddTransaction";
import { useGetTransactions } from "../../hooks/useGetTransactions";
import { useGetUserInfo } from "../../hooks/useGetUserInfo";
import { useNavigate } from "react-router-dom";
import { useDeleteTransaction } from "../../hooks/useDeleteTransaction";

import "./styles.css";
import { auth } from "../../config/firebase-config";

export const ExpenseTracker = () => {
  const { addTransaction } = useAddTransaction();
  const { transactions, transactionTotals } = useGetTransactions();
  const { name, profilePhoto } = useGetUserInfo();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionType, setTransactionType] = useState("expense");

  const { deleteTransaction } = useDeleteTransaction();

  const { balance, income, expenses } = transactionTotals;

  // SECURITY / correctness: the page used to trust localStorage alone.
  // Now we ask Firebase Auth. If there is no real signed-in user
  // (session expired, or someone faked localStorage), clear the stale
  // info and send them back to the sign-in page.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        localStorage.removeItem("auth");
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const onSubmit = (e) => {
    e.preventDefault();
    addTransaction({
      description,
      transactionAmount,
      transactionType,
    });

    setDescription("");
    setTransactionAmount("");
  };

  const signUserOut = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="expense-tracker">
        <div className="container">
          <h1> {name}'s Expense Tracker</h1>
          <div className="balance">
            <h3>Your Balance</h3>
            {balance >= 0 ? <h2> R{balance}</h2> : <h2> -R{balance * -1}</h2>}
          </div>
          <div className="summary">
            <div className="income">
              <h4>Income</h4>
              <p>R{income}</p>
            </div>
            <div className="expenses">
              <h4>Expenses</h4>
              <p>R{expenses}</p>
            </div>
          </div>
          <form className="add-transaction" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="Description"
              value={description}
              required
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount"
              min="0"
              value={transactionAmount}
              required
              onChange={(e) => setTransactionAmount(e.target.value)}
            />
            <div className="radio-group">
              <input
                type="radio"
                id="expense"
                value="expense"
                checked={transactionType === "expense"}
                onChange={(e) => setTransactionType(e.target.value)}
              />
              <label htmlFor="expense">Expense</label>
              <input
                type="radio"
                id="income"
                value="income"
                checked={transactionType === "income"}
                onChange={(e) => setTransactionType(e.target.value)}
              />
              <label htmlFor="income">Income</label>
            </div>
            <button type="submit">Add Transaction</button>
          </form>
        </div>
        {profilePhoto && (
          <div className="profile">
            <img
              className="profile-photo"
              src={profilePhoto}
              alt="profile"
              referrerPolicy="no-referrer"
            />{" "}
            <button className="sign-out-button" onClick={signUserOut}>
              Sign Out
            </button>
          </div>
        )}
      </div>
      <div className="transactions">
        <h3>Transactions</h3>
        <ul>
          {transactions.map((transaction) => {
            const { description, transactionAmount, transactionType, id } =
              transaction;
            return (
              <li
                key={id}
                style={{
                  borderLeftColor:
                    transactionType === "expense" ? "#e57373" : "#66bb6a",
                }}
              >
                <div className="transaction-content">
                  <h4>{description}</h4>
                  <p>
                    R{transactionAmount} ·{" "}
                    <label
                      style={{
                        color: transactionType === "expense" ? "red" : "green",
                      }}
                    >
                      {" "}
                      {transactionType}{" "}
                    </label>
                  </p>
                </div>

                <button
                  className="delete-transaction-button"
                  onClick={() => deleteTransaction(id)}
                  aria-label="Delete transaction"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};
