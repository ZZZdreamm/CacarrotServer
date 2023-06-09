import { dbRef } from "./FirebaseConfig.js";
import { randomUUID } from "crypto";



export async function loginInDB(credentials){
    const snapshot = await dbRef.child('usersAccounts').once('value');
    const userAccounts = snapshot.val();
    let thisUser = {id:'', email:''}
    if(userAccounts){
        Object.values(userAccounts).forEach((user)=>{
            if(user.email == credentials.email && user.password == credentials.password){
                thisUser.id = user.id
                thisUser.email = user.email
            }
        })
    }
    return thisUser

}

export async function registerInDb(credentials) {
    const snapshot = await dbRef.child('usersAccounts').once('value');
    const userAccounts = snapshot.val();
    let noUsersWithUsername = true
    if(userAccounts){
        Object.values(userAccounts).forEach((user)=>{
            if(user.email == credentials.email){
                noUsersWithUsername = false
            }
        })
    }
    if(noUsersWithUsername){
        const user = {id:randomUUID(), email:credentials.email}
        dbRef.child('usersAccounts').child(user.id).set({id: user.id,email:credentials.email, password:credentials.password})
        return user
    }else{
        return {id:'', email:''}
    }
}