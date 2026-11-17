// Reads the DISPLAY info we saved at sign-in (name + photo).
//
// SECURITY NOTE: localStorage is just a notepad in the browser. Anyone can
// open devtools and edit it, so nothing in here is trusted for security.
// - isAuth is only used to decide which page to SHOW first.
// - The real "who is this user?" answer comes from Firebase Auth
//   (auth.currentUser / onAuthStateChanged), and the real protection
//   comes from the Firestore security rules.
export const useGetUserInfo = () => {
  const { name, profilePhoto, isAuth } =
    JSON.parse(localStorage.getItem("auth")) || {};

  return { name, profilePhoto, isAuth };
};
