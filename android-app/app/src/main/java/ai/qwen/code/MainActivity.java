package ai.qwen.code;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class MainActivity extends AppCompatActivity {
  @Override
  protected void onCreate(@Nullable Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    RecyclerView history = findViewById(R.id.history_list);
    View empty = findViewById(R.id.empty_state);
    FloatingActionButton fab = findViewById(R.id.fab);

    fab.setOnClickListener(v -> {
      Intent i = new Intent(this, ChatActivity.class);
      startActivity(i);
    });

    // TODO: hook up real data and toggle empty/history visibility
    empty.setVisibility(View.VISIBLE);
    history.setVisibility(View.GONE);
  }
}