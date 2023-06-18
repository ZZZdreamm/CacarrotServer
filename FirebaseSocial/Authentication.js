import { socialFirestore, usersFireStore } from "./FirebaseConfig.js";
import { randomUUID } from "crypto";

export async function loginInSocial(credentials){
    const snapshot = await usersFireStore.get()
    let thisUser = {id:'', email:'', profileImage:''}
    snapshot.forEach((shot) => {
        const user = shot.data()
        if(user.Email == credentials.email && user.Password == credentials.password){
            thisUser.id = shot.id
            thisUser.email = user.Email
            thisUser.profileImage = user.ProfileImage
        }
    })
    return thisUser

}

export async function registerInSocial(credentials) {
    const snapshot = await usersFireStore.get()
    let noUsersWithUsername = true
    snapshot.forEach((shot) => {
        const user = shot.data()
        if(user.Email == credentials.email){
            noUsersWithUsername = false
        }
    })

    if(noUsersWithUsername){
        let user = {email:credentials.email, profileImage:''}
        await usersFireStore.add({Email:credentials.email, Password:credentials.password, ProfileImage:user.profileImage}).then((doc) => {
            user['id'] = doc.id
        })
        return user
    }else{
        return {id:'', email:'', profileImage:''}
    }
}