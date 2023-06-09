import firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/compat/firestore"
import "firebase/compat/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDusTR62nXSXyjblgvFNIFGepxtzYxHVF8",
  authDomain: "kakoot-d06ff.firebaseapp.com",
  databaseURL: "https://kakoot-d06ff-default-rtdb.firebaseio.com",
  projectId: "kakoot-d06ff",
  storageBucket: "kakoot-d06ff.appspot.com",
  messagingSenderId: "594818848188",
  appId: "1:594818848188:web:331461933f89b9bcb707b9"
};

firebase.initializeApp(firebaseConfig);
//@ts-ignore
export const db = firebase.database()
export const dbRef = firebase.database().ref()
export const usersRef = dbRef.child('users')
export const gamesRef = dbRef.child('games')




