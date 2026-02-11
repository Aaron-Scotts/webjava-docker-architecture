const axios = require("axios");

const authUrl = process.env.AUTH_URL || "http://auth:3000";

async function getUserFromAuth(req) {
  const authHeader = req.header("authorization");
  const cookieHeader = req.header("cookie");
  if (!authHeader) {
    if (!cookieHeader) {
      return null;
    }
  }
  try {
    const authRes = await axios.get(`${authUrl}/validate`, {
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      timeout: 2000,
    });
    if (authRes.data && authRes.data.valid) {
      return authRes.data.user;
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = { getUserFromAuth };
