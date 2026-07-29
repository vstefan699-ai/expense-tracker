import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase-config";

export const useDeleteTransaction = () => {
  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
    } catch (err) {
      console.error(err);
    }
  };

  return { deleteTransaction };
};