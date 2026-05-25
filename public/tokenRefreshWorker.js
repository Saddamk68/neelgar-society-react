/**
 * tokenRefreshWorker.js
 *
 * A Web Worker that runs in a background thread — separate from the browser's
 * main UI thread. This means it keeps ticking even when the tab is idle,
 * hidden, or the laptop lid is closed. Unlike setTimeout in the main thread,
 * browser throttling does NOT affect this worker.
 *
 * HOW IT WORKS (Java analogy):
 *   Think of this like a ScheduledExecutorService running in a daemon thread.
 *   The main thread (AuthContext) sends it a "start" message with a delay,
 *   the worker waits that many milliseconds, then posts back a "fire" message
 *   telling AuthContext: "time to refresh the token now."
 *
 * MESSAGES THIS WORKER RECEIVES:
 *   { type: "start", delay: <number in ms> }  — start a countdown
 *   { type: "stop" }                           — cancel any running countdown
 *
 * MESSAGES THIS WORKER SENDS BACK:
 *   { type: "fire" }                           — delay elapsed, go refresh now
 */

let timerId = null;

self.onmessage = function (event) {
  const { type, delay } = event.data;

  if (type === "start") {
    // Cancel any previous timer before starting a new one
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    if (typeof delay !== "number" || delay <= 0) return;

    timerId = setTimeout(function () {
      timerId = null;
      self.postMessage({ type: "fire" });
    }, delay);
  }

  if (type === "stop") {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }
};
