package ai.qwen.code;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class ChatActivity extends AppCompatActivity {
  private NodeBridge.Listener nodeListener;

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_chat);

    EditText input = findViewById(R.id.input);
    Button send = findViewById(R.id.send);

    nodeListener = new NodeBridge.Listener() {
      @Override public void onStdout(String line) { /* TODO: append to chat */ }
      @Override public void onStderr(String line) { /* TODO: append error */ }
      @Override public void onExit(int code) { /* TODO: handle exit */ }
    };

    send.setOnClickListener(v -> {
      String prompt = input.getText().toString();
      // Start Node once; pass CLI args to run single prompt non-interactively
      String[] args = new String[]{
          "node", "qwen", "--model", "qwen3-coder-plus", "-p", prompt
      };
      NodeBridge.startNode(getApplicationContext(), args, nodeListener);
    });
  }
}