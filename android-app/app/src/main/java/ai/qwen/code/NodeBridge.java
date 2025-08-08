package ai.qwen.code;

import android.content.Context;
import android.util.Log;
import java.io.File;
import java.util.concurrent.atomic.AtomicBoolean;

public class NodeBridge {
  public interface Listener {
    void onStdout(String line);
    void onStderr(String line);
    void onExit(int code);
  }

  private static final AtomicBoolean started = new AtomicBoolean(false);

  public static void startNode(Context context, String[] cliArgs, Listener listener) {
    if (started.getAndSet(true)) return;
    new Thread(() -> {
      try {
        System.loadLibrary("nodejs-mobile");
      } catch (Throwable t) {
        Log.e("NodeBridge", "Failed loading nodejs-mobile lib", t);
      }
      try {
        // Copy nodejs project assets to internal storage for Node to access
        File projDir = AssetUtils.copyAssetsDir(context, "nodejs-project", "nodejs-project");
        File indexJs = new File(projDir, "index.js");

        // Compose arguments: node index.js -- <cliArgs>
        String[] full = new String[2 + cliArgs.length];
        full[0] = indexJs.getAbsolutePath();
        full[1] = "--";
        System.arraycopy(cliArgs, 0, full, 2, cliArgs.length);

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