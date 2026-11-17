// =====================================================================
// Firestore security-rules tests
// Run with:  npm run test:rules
// (starts the local Firestore emulator, runs these tests, shuts it down)
//
// Nothing here touches your real database — it all runs in the emulator.
// =====================================================================
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} = require("firebase/firestore");

const PROJECT_ID = "demo-expense-tracker"; // "demo-" = emulator-only project
const ALICE = "alice_uid";
const BOB = "bob_uid";

let testEnv;

// A valid transaction for a given user
const validTx = (uid, overrides = {}) => ({
  userID: uid,
  description: "Groceries",
  transactionAmount: "250",
  transactionType: "expense",
  createdAt: serverTimestamp(),
  ...overrides,
});

// Firestore handles for each kind of visitor
const aliceDb = () => testEnv.authenticatedContext(ALICE).firestore();
const bobDb = () => testEnv.authenticatedContext(BOB).firestore();
const guestDb = () => testEnv.unauthenticatedContext().firestore();

// Put data in the DB while BYPASSING the rules (like an admin would)
async function seed() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const ts = Timestamp.now();
    await setDoc(doc(db, "transactions", "aliceTx"), {
      userID: ALICE, description: "Salary", transactionAmount: "10000",
      transactionType: "income", createdAt: ts,
    });
    await setDoc(doc(db, "transactions", "bobTx"), {
      userID: BOB, description: "Fuel", transactionAmount: "800",
      transactionType: "expense", createdAt: ts,
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, "..", "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed();
});

after(async () => {
  await testEnv.cleanup();
});

// ---------------------------------------------------------------------
describe("Unauthenticated (signed-out) visitor", () => {
  it("cannot read a single transaction", async () => {
    await assertFails(getDoc(doc(guestDb(), "transactions", "aliceTx")));
  });
  it("cannot list all transactions", async () => {
    await assertFails(getDocs(collection(guestDb(), "transactions")));
  });
  it("cannot query a user's transactions even with the right userID", async () => {
    const q = query(collection(guestDb(), "transactions"), where("userID", "==", ALICE));
    await assertFails(getDocs(q));
  });
  it("cannot create a transaction", async () => {
    await assertFails(addDoc(collection(guestDb(), "transactions"), validTx(ALICE)));
  });
  it("cannot delete a transaction", async () => {
    await assertFails(deleteDoc(doc(guestDb(), "transactions", "aliceTx")));
  });
});

// ---------------------------------------------------------------------
describe("Reading", () => {
  it("ALLOWED: Alice reads her own transaction by ID", async () => {
    await assertSucceeds(getDoc(doc(aliceDb(), "transactions", "aliceTx")));
  });
  it("ALLOWED: Alice runs the app's real query (her userID + orderBy createdAt)", async () => {
    const q = query(
      collection(aliceDb(), "transactions"),
      where("userID", "==", ALICE),
      orderBy("createdAt")
    );
    const snap = await assertSucceeds(getDocs(q));
    if (snap.size !== 1) throw new Error(`expected 1 doc, got ${snap.size}`);
  });
  it("DENIED: Alice reads Bob's transaction by ID", async () => {
    await assertFails(getDoc(doc(aliceDb(), "transactions", "bobTx")));
  });
  it("DENIED: Alice queries with Bob's userID", async () => {
    const q = query(collection(aliceDb(), "transactions"), where("userID", "==", BOB));
    await assertFails(getDocs(q));
  });
  it("DENIED: Alice lists the whole collection with no filter", async () => {
    await assertFails(getDocs(collection(aliceDb(), "transactions")));
  });
});

// ---------------------------------------------------------------------
describe("Creating", () => {
  it("ALLOWED: Alice creates a valid expense for herself", async () => {
    await assertSucceeds(addDoc(collection(aliceDb(), "transactions"), validTx(ALICE)));
  });
  it("ALLOWED: Alice creates a valid income with decimals", async () => {
    await assertSucceeds(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { transactionType: "income", transactionAmount: "99.95" })));
  });
  it("ALLOWED: amount stored as a real number also works", async () => {
    await assertSucceeds(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { transactionAmount: 150 })));
  });
  it("DENIED: Alice creates a transaction with Bob's userID (ownership spoofing)", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"), validTx(BOB)));
  });
  it("DENIED: missing userID", async () => {
    const tx = validTx(ALICE); delete tx.userID;
    await assertFails(addDoc(collection(aliceDb(), "transactions"), tx));
  });
  it("DENIED: extra unexpected field", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { isAdmin: true })));
  });
  it("DENIED: invalid transactionType", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { transactionType: "refund" })));
  });
  it("DENIED: negative amount", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { transactionAmount: "-500" })));
  });
  it("DENIED: non-numeric amount", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { transactionAmount: "lots" })));
  });
  it("DENIED: empty description", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { description: "" })));
  });
  it("DENIED: description longer than 200 characters", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { description: "x".repeat(201) })));
  });
  it("DENIED: client-chosen createdAt instead of serverTimestamp()", async () => {
    await assertFails(addDoc(collection(aliceDb(), "transactions"),
      validTx(ALICE, { createdAt: Timestamp.fromDate(new Date("2020-01-01")) })));
  });
});

// ---------------------------------------------------------------------
describe("Updating (the app never edits transactions)", () => {
  it("DENIED: Alice edits her own transaction", async () => {
    await assertFails(updateDoc(doc(aliceDb(), "transactions", "aliceTx"),
      { transactionAmount: "1" }));
  });
  it("DENIED: Alice 'gives' her transaction to Bob by changing userID", async () => {
    await assertFails(updateDoc(doc(aliceDb(), "transactions", "aliceTx"),
      { userID: BOB }));
  });
  it("DENIED: Alice overwrites Bob's transaction with setDoc to steal it", async () => {
    await assertFails(setDoc(doc(aliceDb(), "transactions", "bobTx"), validTx(ALICE)));
  });
});

// ---------------------------------------------------------------------
describe("Deleting", () => {
  it("ALLOWED: Alice deletes her own transaction", async () => {
    await assertSucceeds(deleteDoc(doc(aliceDb(), "transactions", "aliceTx")));
  });
  it("DENIED: Alice deletes Bob's transaction", async () => {
    await assertFails(deleteDoc(doc(aliceDb(), "transactions", "bobTx")));
  });
  it("ALLOWED: Bob deletes his own transaction", async () => {
    await assertSucceeds(deleteDoc(doc(bobDb(), "transactions", "bobTx")));
  });
});

// ---------------------------------------------------------------------
describe("Other collections", () => {
  it("DENIED: signed-in user writes to some other collection", async () => {
    await assertFails(setDoc(doc(aliceDb(), "users", ALICE), { role: "admin" }));
  });
  it("DENIED: signed-in user reads some other collection", async () => {
    await assertFails(getDoc(doc(aliceDb(), "secrets", "x")));
  });
});
