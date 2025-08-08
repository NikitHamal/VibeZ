package ai.qwen.code;

import android.content.Context;
import android.util.Log;
import java.util.concurrent.atomic.AtomicBoolean;

public class NodeBridge {
  public interface Listener {
    void onStdout(String line);
    void onStderr(String line);
    void onExit(int code);
  }

  private static final AtomicBoolean started = new AtomicBoolean(false);

  public static void startNode(Context context, String[] args, Listener listener) {
    if (started.getAndSet(true)) return;
    new Thread(() -> {
      try {
        System.loadLibrary("nodejs-mobile");
      } catch (Throwable t) {
        Log.e("NodeBridge", "Failed loading nodejs-mobile lib", t);
      }
      try {
        // Compose arguments to run our index.js bootstrap
        String[] full = new String[2 + args.length];
        full[0] = "node";
        full[1] = context.getFilesDir().getAbsolutePath(); // placeholder, not used by node mobile
        System.arraycopy(args, 0, full, 2, args.length);
        int code = startNodeWithArgs(full, listener);
        listener.onExit(code);
      } catch (Throwable t) {
        listener.onStderr("Node crashed: " + t.getMessage());
        listener.onExit(-1);
      }
    }, "NodeThread").start();
  }

  private static native int startNodeWithArgs(String[] args, Listener listener);
}