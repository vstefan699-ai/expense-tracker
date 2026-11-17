import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase-config";

export const useAddTransaction = () => {
  const transactionCollectionRef = collection(db, "transactions");

  const addTransaction = async ({
    description,
    transactionAmount,
    transactionType,
  }) => {
    // SECURITY: take the UID from Firebase Auth (the real signed-in user),
    // NOT from localStorage. localStorage can be edited by anyone in devtools.
    const user = auth.currentUser;
    if (!user) {
      console.error("Cannot add transaction: no signed-in user.");
      return;
    }

    try {
      await addDoc(transactionCollectionRef, {
        userID: user.uid,
        description,
        transactionAmount,
        transactionType,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // e.g. "permission-denied" if the Firestore rules reject the data
      console.error(err);
    }
  };

  return { addTransaction };
};
