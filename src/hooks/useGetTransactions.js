import { useEffect, useState } from "react";
import {
  query,
  collection,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../config/firebase-config";

const emptyTotals = { balance: 0.0, income: 0.0, expenses: 0.0 };

export const useGetTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionTotals, setTransactionTotals] = useState(emptyTotals);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    // Wait for Firebase to tell us who is REALLY signed in.
    // On a page refresh, Firebase needs a moment to restore the session;
    // querying before that would be sent as "not signed in" and the
    // security rules would (correctly) reject it.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Stop listening to the previous user's data (if any).
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!user) {
        setTransactions([]);
        setTransactionTotals(emptyTotals);
        return;
      }

      // SECURITY: filter by the verified Firebase UID, not localStorage.
      // The rules REQUIRE this where() filter — without it the query is denied.
      const queryTransactions = query(
        collection(db, "transactions"),
        where("userID", "==", user.uid),
        orderBy("createdAt")
      );

      unsubscribeSnapshot = onSnapshot(
        queryTransactions,
        (snapshot) => {
          let docs = [];
          let totalIncome = 0;
          let totalExpenses = 0;

          snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            docs.push({ ...data, id });

            if (data.transactionType === "expense") {
              totalExpenses += Number(data.transactionAmount);
            } else {
              totalIncome += Number(data.transactionAmount);
            }
          });

          setTransactions(docs);

          let balance = totalIncome - totalExpenses;
          setTransactionTotals({
            balance,
            expenses: totalExpenses,
            income: totalIncome,
          });
        },
        (err) => {
          console.error(err);
        }
      );
    });

    // Cleanup when the page unmounts: stop both listeners.
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return { transactions, transactionTotals };
};
