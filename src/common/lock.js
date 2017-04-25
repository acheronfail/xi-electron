import lockfile from 'proper-lockfile';

import { PREFS_LOCK } from './environment';

/**
 * File operations.
 */

// Time in ms after which to abort the operation.
const MAX_WAIT = 10000;
// Time in ms to wait before re-attempting to gain a lock.
const POLL_LOCK = 125;

// Request access to write the settings files.
export function requestLock(op, _start) {
  _start = _start || Date.now();

  lockfile.lock(PREFS_LOCK, compromised, (err, release) => {
    if (err) return compromised(err);
    op(null, release);
  });

  function compromised(err) {
    // Abort if we've been trying too long.
    if (Date.now() - _start > MAX_WAIT) {
      return op(new Error('Request timed out.'));
    }
    // If resource still locked, keep trying trying.
    if (err.code == 'ELOCKED') {
      setTimeout(() => requestLock(op, _start), POLL_LOCK);
    }
  }
}

// Used to clean up our lockfiles.
export function releaseLock() {
  try {
    if (lockfile.checkSync(PREFS_LOCK)) {
      lockfile.unlockSync(PREFS_LOCK);
    }
  } catch (err) {
    // Fail gracefully if we couldn't remove the lock.
  }
}
