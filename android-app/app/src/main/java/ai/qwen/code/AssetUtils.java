package ai.qwen.code;

import android.content.Context;
import android.content.res.AssetManager;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class AssetUtils {
  public static File copyAssetsDir(Context ctx, String assetDirName, String destDirName) throws IOException {
    File destDir = new File(ctx.getFilesDir(), destDirName);
    if (!destDir.exists() && !destDir.mkdirs()) {
      throw new IOException("Failed to create dir: " + destDir.getAbsolutePath());
    }
    copyDir(ctx.getAssets(), assetDirName, destDir);
    return destDir;
  }

  private static void copyDir(AssetManager am, String assetPath, File destDir) throws IOException {
    String[] list = am.list(assetPath);
    if (list == null || list.length == 0) {
      // file
      copyFile(am, assetPath, new File(destDir, new File(assetPath).getName()));
      return;
    }
    // dir
    File newDir = new File(destDir, new File(assetPath).getName());
    if (!newDir.exists() && !newDir.mkdirs()) {
      throw new IOException("Failed to mkdir: " + newDir.getAbsolutePath());
    }
    for (String name : list) {
      String childAssetPath = assetPath + "/" + name;
      String[] children = am.list(childAssetPath);
      if (children != null && children.length > 0) {
        copyDir(am, childAssetPath, newDir);
      } else {
        copyFile(am, childAssetPath, new File(newDir, name));
      }
    }
  }

  private static void copyFile(AssetManager am, String assetFilePath, File outFile) throws IOException {
    if (outFile.exists()) return;
    try (InputStream in = am.open(assetFilePath); FileOutputStream out = new FileOutputStream(outFile)) {
      byte[] buf = new byte[8192];
      int r;
      while ((r = in.read(buf)) != -1) {
        out.write(buf, 0, r);
      }
    }
  }
}