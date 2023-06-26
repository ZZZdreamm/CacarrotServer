import {
  commentsFireStore,
  likesFireStore,
  postImagesStorage,
  postsFireStore,
  usersFireStore,
} from "./FirebaseConfig.js";
import { uploadBytes } from "firebase/storage";
import { randomUUID } from "crypto";

export async function searchUsers(query) {
  const snapshot = await usersFireStore.get();
  let users = [];
  snapshot.forEach((shot) => {
    const user = shot.data();
    if (user.Email.includes(query)) {
      users.push({
        Id: shot.id,
        Email: user.Email,
        ProfileImage: user.ProfileImage,
      });
    }
  });
  return users;
}

export async function getUser(id) {
  const snapshot = await usersFireStore.doc(id);

  let thisUser;
  await snapshot
    .get()
    .then(async (querySnapshot) => {
      const data = querySnapshot.data();
      thisUser = {
        Id: querySnapshot.id,
        Email: data.Email,
        ProfileImage: data.ProfileImage,
      };
    })
    .catch(() => {
      thisUser = {
        Id: "",
        Email: "",
        ProfileImage: "",
      };
    });
  return thisUser;
}

export async function postPost(post) {
  const doc = await postsFireStore.add({
    AutorName: post.AutorName,
    AmountOfComments: post.AmountOfComments || 0,
    AmountOfLikes: post.AmountOfLikes || 0,
    TextContent: post.TextContent || "",
    MediaFiles: post.MediaFiles || "",
    Date: post.Date,
  });
  const data = (await doc.get()).data();
  const autorImage = await getUserImage(data.AutorName);
  const newPost = {
    ...data,
    Id: doc.id,
    AutorProfileImage: autorImage || ""
  };
  return newPost;
}

export async function getPosts(numberOfPosts) {
  const query = postsFireStore.limit(numberOfPosts);
  let posts = [];
  await query
    .orderBy("Date", "desc")
    .get()
    .then(async (querySnapshot) => {
      const promises = querySnapshot.docs.map(async (doc) => {
        const autorImage = await getUserImage(doc.data().AutorName);
        let post = {
          ...doc.data(),
          Id: doc.id,
          AutorProfileImage: autorImage || "",
        };
        return post;
      });
      posts = await Promise.all(promises);
    });
  return posts;
}

export async function getUserImage(username) {
  let image;
  await usersFireStore.get().then((querySnapshot) => {
    querySnapshot.forEach((user) => {
      const data = user.data();
      if (data.Email == username) {
        image = data.ProfileImage;
      }
    });
  });
  return image;
}

export async function likePost(postId, userId) {
  const postRef = postsFireStore.doc(postId);
  postRef.collection("Likes").add({ UserId: userId });
  await postRef.get().then(async (doc) => {
    const likes = await doc.data().AmountOfLikes;
    await postRef.set({
      ...doc.data(),
      AmountOfLikes: likes + 1,
    });
  });
}

export async function removeLike(postId, userId) {
  const postRef = postsFireStore.doc(postId);
  const likesRef = postRef.collection("Likes");
  await likesRef.get().then(async (docs) => {
    docs.forEach(async (doc) => {
      const data = doc.data();
      if (data.UserId == userId) {
        await likesRef.doc(doc.id).delete();
      }
    });
  });
  await postRef.get().then(async (doc) => {
    const likes = await doc.data().AmountOfLikes;
    await postRef.set({
      ...doc.data(),
      AmountOfLikes: likes - 1,
    });
  });
}

export async function ifUserLiked(postId, userId) {
  const likesRef = postsFireStore.doc(postId).collection("Likes");
  let liked = false;
  await likesRef.get().then(async (docs) => {
    docs.forEach(async (doc) => {
      const data = doc.data();
      if (data.UserId == userId) {
        liked = true;
      }
    });
  });
  return liked;
}

export async function putComment(PostId, UserId, TextContent, AutorName, Date) {
  const commentsRef = postsFireStore.doc(PostId);
  await commentsRef.get().then(async (doc) => {
    const comments = await doc.data().AmountOfComments;
    await commentsRef.set({
      ...doc.data(),
      AmountOfComments: comments + 1,
    });
  });
  const snapshot = await commentsRef
    .collection("Comments")
    .add({ UserId, TextContent, AutorName, Date });
  const data = await snapshot.get();
  return {
    ...data.data(),
    PostId: snapshot.id,
  };
}

export async function getComments(PostId, numberOfComments) {
  const commentsRef = postsFireStore.doc(PostId).collection("Comments");
  const query = commentsRef.limit(numberOfComments);
  let comments = [];
  await query.get().then(async (querySnapshot) => {
    const promises = querySnapshot.docs.map(async (doc) => {
      const autorImage = await getUserImage(doc.data().AutorName);
      let comment = {
        ...doc.data(),
        Id: doc.id,
        AutorProfileImage: autorImage || "",
      };
      return comment;
    });
    comments = await Promise.all(promises);
  });
  return comments;
}

export async function sendFriendRequest(UserId, FriendId) {
  const userRef = usersFireStore.doc(UserId).collection("SentFriendRequests");
  const friendRef = usersFireStore.doc(FriendId).collection("FriendRequests");
  userRef.doc(FriendId).set({});
  friendRef.doc(UserId).set({});
  const friendDoc = await usersFireStore.doc(FriendId).get();
  const friend = {
    ...friendDoc.data(),
    Id: friendDoc.id,
  }
  return friend
}

export async function AcceptFriendRequest(UserId, FriendId) {
  const userRef = usersFireStore.doc(UserId).collection("FriendRequests");
  const friendRef = usersFireStore
    .doc(FriendId)
    .collection("SentFriendRequests");
  await userRef.doc(FriendId).delete();
  await friendRef.doc(UserId).delete();
  const userFriendsRef = usersFireStore.doc(UserId).collection("Friends");
  const friendFriendsRef = usersFireStore.doc(FriendId).collection("Friends");
  await userFriendsRef.doc(FriendId).set({});
  await friendFriendsRef.doc(UserId).set({});
  const hold = await usersFireStore.doc(FriendId).get();
  const data = hold.data();
  const friend = {
    Email: data.Email,
    ProfileImage: data.ProfileImage,
    Id: hold.id,
  };
  return friend;
}

export async function removeFriendRequest(UserId, FriendId) {
  const userRef = usersFireStore.doc(UserId).collection("SentFriendRequests");
  const friendRef = usersFireStore.doc(FriendId).collection("FriendRequests");
  await userRef.doc(FriendId).delete();
  await friendRef.doc(UserId).delete();
  return { Id: FriendId };
}

export async function getFriends(UserId) {
  const userRef = usersFireStore.doc(UserId).collection("Friends");
  const friendIds = await getFirebaseDocsIds(userRef);
  let friends = [];
  await Promise.all(
    friendIds.map(async (requestId) => {
      const user = await getUser(requestId);
      friends.push(user);
    })
  );
  return friends;
}

export async function getFriendRequests(UserId) {
  const userRef = usersFireStore.doc(UserId).collection("FriendRequests");
  const requestsIds = await getFirebaseDocsIds(userRef);
  let requestUsers = [];
  await Promise.all(
    requestsIds.map(async (requestId) => {
      const requestUser = await getUser(requestId);
      requestUsers.push(requestUser);
    })
  );
  return requestUsers;
}

export async function getSentFriendRequests(UserId) {
  const userRef = usersFireStore.doc(UserId).collection("SentFriendRequests");
  const requestsIds = await getFirebaseDocsIds(userRef);
  let requestUsers = [];
  await Promise.all(
    requestsIds.map(async (requestId) => {
      const requestUser = await getUser(requestId);
      requestUsers.push(requestUser);
    })
  );
  return requestUsers;
}

async function getFirebaseListData(firebaseRef) {
  let listOfData = [];
  await firebaseRef.get().then(async (querySnapshot) => {
    const promises = querySnapshot.docs.map(async (doc) => {
      let data = doc.data();
      return data;
    });
    listOfData = await Promise.all(promises);
  });
  return listOfData;
}

async function getFirebaseDocsIds(firebaseRef) {
  const listOfDocsIds = (await firebaseRef.get()).docs.map((doc) => {
    return doc.id;
  });
  return listOfDocsIds;
}

export async function removeFriend(UserId, FriendId) {
  const userRef = usersFireStore.doc(UserId).collection("Friends");
  const friendRef = usersFireStore.doc(FriendId).collection("Friends");
  userRef.doc(FriendId).delete();
  friendRef.doc(UserId).delete();
  return { Id: FriendId };
}

export async function checkIfInFriends(UserId, FriendId) {
  if (UserId == FriendId) {
    return "me";
  }
  const inFriends = (
    await usersFireStore.doc(UserId).collection("Friends").doc(FriendId).get()
  ).exists;
  if (inFriends) {
    return "inFriends";
  }
  const inFriendRequests = (
    await usersFireStore
      .doc(UserId)
      .collection("SentFriendRequests")
      .doc(FriendId)
      .get()
  ).exists;
  const pendingRequest = (
    await usersFireStore
      .doc(UserId)
      .collection("FriendRequests")
      .doc(FriendId)
      .get()
  ).exists;
  if (inFriendRequests) {
    return "inFriendRequests";
  }
  if(pendingRequest){
    return "pendingRequest"
  }
  return "stranger";
}

export async function changeProfileImage(UserId, fileURL) {
  await usersFireStore.doc(UserId).update({ ProfileImage: fileURL });
}

export async function getUserPosts(name, numberOfPosts) {
  const query = postsFireStore.limit(numberOfPosts);
  let posts = [];
  await query
    .orderBy("Date", "desc")
    .get()
    .then(async (querySnapshot) => {
      let tempPosts;
      const promises = querySnapshot.docs.map(async (doc) => {
        const autorName = doc.data().AutorName;
        if (name == autorName) {
          const autorImage = await getUserImage(autorName);
          let post = {
            ...doc.data(),
            Id: doc.id,
            AutorProfileImage: autorImage || "",
          };
          return post;
        }
      });
      tempPosts = await Promise.all(promises);
      tempPosts.forEach((post) => {
        if (post) {
          posts.push(post);
        }
      });
    });
  return posts;
}

export async function sendMessage(message) {
  if (message.MediaFiles.length <= 0 && !message.TextContent && !message.VoiceFile) {
    const likeURL = `https://firebasestorage.googleapis.com/v0/b/facebugserver.appspot.com/o/usefulImages%2Flike.png?alt=media&token=5c145cfb-8601-4206-9142-5d79fbb3d8c0/like.png`
    message = {
      ...message,
      MediaFiles: [likeURL],
    };
  }
  let createdMessage;
  await usersFireStore
    .doc(message.SenderId)
    .collection("Messages")
    .doc(message.ReceiverId)
    .collection("Messages")
    .add(message)
    .then((docRef) => {
      createdMessage = {
        ...message,
        Id: docRef.id,
      };
    });
  await usersFireStore
    .doc(message.ReceiverId)
    .collection("Messages")
    .doc(message.SenderId)
    .collection("Messages")
    .add(message);
  return createdMessage;
}

export async function getChatMessages(UserId, FriendId, NumberOfMessages) {
  const query = usersFireStore
    .doc(UserId)
    .collection("Messages")
    .doc(FriendId)
    .collection("Messages")
    .limit(NumberOfMessages);
  let messages;
  await query
    .orderBy("Date", "desc")
    .get()
    .then(async (querySnapshot) => {
      const promises = querySnapshot.docs.map(async (doc) => {
        let message = {
          ...doc.data(),
          Id: doc.id,
        };
        return message;
      });
      messages = await Promise.all(promises);
    });

  return messages;
}



export function searchFriends(friends, searchName){
  const filteredFriends = friends.filter((friend) => {
    return friend.Email.toLowerCase().includes(searchName.toLowerCase());
  });
  return filteredFriends;
}