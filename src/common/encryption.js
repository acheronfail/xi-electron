import crypto from 'crypto';

// The main reason we encrypt the `Main.xi-conf` file is just to
// deter the user from changing it. There's no data to hide, but
// we don't want the values in our main config changing unexpectly.

// Our encryption algorithm.
const ALGORITHM = 'aes-256-ctr';

// Our cipher key.
const KEY = 'xi-editor-FTW';

export function encrypt(text) {
  const cipher = crypto.createCipher(ALGORITHM, KEY);
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(text) {
  const decipher = crypto.createDecipher(ALGORITHM, KEY);
  return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
}
