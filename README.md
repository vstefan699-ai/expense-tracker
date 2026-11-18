# Expense Tracker

A personal income and expense tracker built with **React** and **Firebase**. Users sign in with Google, record transactions and see their balance update in real time. Each user can only access their own records.

**Live demo:** https://expense-tracker-78e06.web.app

> **About this project:** I built the core app by following a tutorial, as part of my web development studies. I then added the work described under [Security](#security): Firestore security rules, automated rules tests, and a fix so the app uses the verified Firebase Auth user ID instead of a value stored in `localStorage`.

## Features

- Google sign-in (Firebase Authentication)
- Add income and expense transactions with a description and amount (in Rand)
- Balance, total income and total expenses calculated automatically
- Real-time updates with Firestore `onSnapshot`
- Delete transactions
- Each user sees only their own transactions, enforced by Firestore security rules

## Tech stack

- React 19 (Create React App), React Router 7
- Firebase Authentication (Google provider)
- Cloud Firestore
- Firebase Hosting
- Mocha + `@firebase/rules-unit-testing` + Firebase Emulator (security rules tests)

## Security

The data is protected server-side by [`firestore.rules`](firestore.rules), not by checks in the React code:

- Users must be signed in to read, create or delete anything.
- A transaction can only be read or deleted by the user whose UID matches its `userID` field (`request.auth.uid`).
- New transactions must belong to the signed-in user, contain only the expected fields, have a valid type (`income`/`expense`), a non-negative amount, a 1–200 character description and a server timestamp.
- Updates are blocked (the app never edits transactions), so ownership can't be changed.
- All other collections are denied by default.

The rules are tested by 30 automated tests in [`firestore-tests/rules.test.js`](firestore-tests/rules.test.js). They cover allowed actions (a user managing their own data) and blocked ones: signed-out access, reading or deleting another user's data, ownership spoofing, invalid data and edits.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22.12 or later (20.19+ also works)
- A Firebase project with **Authentication** (Google provider enabled) and **Cloud Firestore**
- Java 21 or later, only needed to run the security rules tests

### 1. Install

```bash
git clone https://github.com/vstefan699-ai/expense-tracker.git
cd expense-tracker
npm install
```

### 2. Configure Firebase (environment variables)

The Firebase config is read from environment variables, so it isn't hardcoded in the source.

1. Copy `.env.example` to a new file called `.env.local` in the project root.
2. Fill in the values from the Firebase console: **Project settings** → **Your apps** card → select your web app → **Config**.

```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

`.env.local` is listed in `.gitignore` and is never committed. Create React App only exposes variables that start with `REACT_APP_`, and it reads them when `npm start` or `npm run build` runs, so restart the dev server after changing them.

> A Firebase **web** config is not a secret: it ends up in the browser bundle of any Firebase web app. The data is protected by the security rules, not by hiding these values.

### 3. Run locally

```bash
npm start
```

Open http://localhost:3000.

### 4. Run the security rules tests

```bash
npm run test:rules
```

This starts the Firestore emulator, runs the tests against `firestore.rules` and shuts the emulator down. Nothing touches the real database. The first run downloads the emulator.

## Deployment

You'll need the Firebase CLI (included as a dev dependency) and must be logged in with `npx firebase login`.

```bash
npm run build
npx firebase deploy --only hosting
npx firebase deploy --only firestore:rules
```

Deploy the app before the rules when both have changed, so the live site is never running old code against new rules.

## Project structure

```
src/
  config/firebase-config.js    Firebase initialisation (reads env variables)
  hooks/                       Firestore and user hooks (add, get, delete transactions)
  pages/auth/                  Google sign-in page
  pages/expense-tracker/       Main tracker page
firestore.rules                Firestore security rules
firestore-tests/               Security rules tests (emulator)
```
