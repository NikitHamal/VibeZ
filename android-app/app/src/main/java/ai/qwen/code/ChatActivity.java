package ai.qwen.code;

import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

public class ChatActivity extends AppCompatActivity {
  private NodeBridge.Listener nodeListener;
  private ChatAdapter adapter;

  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_chat);

    RecyclerView list = findViewById(R.id.chat_list);
    list.setLayoutManager(new LinearLayoutManager(this));
    adapter = new ChatAdapter();
    list.setAdapter(adapter);

    EditText input = findViewById(R.id.input);
    Button send = findViewById(R.id.send);

    nodeListener = new NodeBridge.Listener() {
      @Override public void onStdout(String line) {
        runOnUiThread(() -> adapter.add(new ChatAdapter.Message(false, line)));
      }
      @Override public void onStderr(String line) {
        runOnUiThread(() -> adapter.add(new ChatAdapter.Message(false, "[err] " + line)));
      }
      @Override public void onExit(int code) {
        runOnUiThread(() -> adapter.add(new ChatAdapter.Message(false, "[exit] " + code)));
      }
    };

    send.setOnClickListener(v -> {
      String prompt = input.getText().toString();
      adapter.add(new ChatAdapter.Message(true, prompt));
      input.setText("");
      // Start Node once; pass CLI args to run single prompt non-interactively via our bootstrap index.js
      String[] args = new String[]{
          "node", "--eval", "require('./index.js')", "-p", prompt, "--model", "qwen3-coder-plus"
      };
      NodeBridge.startNode(getApplicationContext(), args, nodeListener);
    });
  }
}