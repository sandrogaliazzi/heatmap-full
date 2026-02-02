function injectClientIP(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  req.clientIP = ip?.replace("::ffff:", "");
  next();
}
export default injectClientIP;
