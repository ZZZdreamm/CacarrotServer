import firebase from "firebase/compat/app";
import "firebase/compat/database";
import "firebase/database";
import "firebase/compat/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCncHs0oDoCmDveoAMZvSkLXuc4syN2Mg4",
  authDomain: "facebugserver.firebaseapp.com",
  databaseURL:
    "https://facebugserver-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "facebugserver",
  storageBucket: "facebugserver.appspot.com",
  messagingSenderId: "915472090039",
  appId: "1:915472090039:web:532f827244997362d29e32",
};

// Initialize Firebase
const secondary = firebase.initializeApp(firebaseConfig, 'secondary');

export const socialFirestore = secondary.firestore()
export const roomsFirestore = socialFirestore.collection("Rooms")
export const usersFireStore = socialFirestore.collection('Users')
export const messagesFireStore = socialFirestore.collection('Messages')
export const commentsFireStore = socialFirestore.collection('Comments')
export const likesFireStore = socialFirestore.collection('Likes')
export const postsFireStore = socialFirestore.collection('Posts')
export const friendRequestsFireStore = socialFirestore.collection('FriendRequests')


export const storageRef = secondary.storage().ref()
export const postImagesStorage = storageRef.child('postImages/image.jpg')
