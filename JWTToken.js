import jwt from "jsonwebtoken"

const secret = "SDWQC12e3aSACDasdsav01jsad01lwapSDf";
export default function createWebToken(data) {
  var token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 10,
      data: data,
    },
    secret
  );
  return token;
}
