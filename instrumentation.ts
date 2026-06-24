export async function register() {
  // Executa apenas no runtime Node.js (servidor), não no Edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initWatcher } = await import("./lib/watcher");
    initWatcher();
  }
}
