import { gamesRef } from "../Firebase/FirebaseConfig.js";

export async function timer(time, game, timeType) {
  const timerRef = gamesRef.child(game.gamecode).child(timeType);

  await timerRef.set(time);
  return new Promise((resolve, reject) => {
    const countdown = setInterval(async () => {
        time -= 1;
        await timerRef.set(time);

        if (time <= 0) {
          clearInterval(countdown);
          resolve()
        }
      }, 1000);
  })
}

export async function timers(time, game){
    await timer(3, game, "startingTime")
    await timer(time, game, "time")
    await timer(time, game, "time")
    timers(time, game)
}