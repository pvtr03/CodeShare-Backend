const crypto = require("crypto");

function formatString(password, desiredLength) {
  if (password.length > desiredLength) {
    // password is longer than 32 characters, trim it
    return password.substring(0, desiredLength);
  } else if (password.length < desiredLength) {
    // password is shorter than 32 characters, pad it with zeroes
    const padding = "0".repeat(desiredLength - password.length);
    return password + padding;
  } else {
    // password is exactly 32 characters, return it as is
    return password;
  }
}
function encrypt(data, password) {
  const formattedPassword = formatString(password, 32);
  const IV = formatString(password, 16);
  const cipher = crypto.createCipheriv("aes-256-cbc", formattedPassword, IV);
  let encryptedData = cipher.update(data, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData;
}
function decrypt(data, password) {
  const formattedPassword = formatString(password, 32);
  const IV = formatString(password, 16);
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    formattedPassword,
    IV
  );
  let decryptedData = decipher.update(data, "hex", "utf-8");
  decryptedData += decipher.final("utf-8");

  return decryptedData;
}

module.exports = { encrypt, decrypt };
