package ai.qwen.code;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.List;

public class ChatAdapter extends RecyclerView.Adapter<ChatAdapter.Holder> {
  public static class Message {
    public final boolean fromUser;
    public final String text;
    public Message(boolean fromUser, String text) { this.fromUser = fromUser; this.text = text; }
  }

  private final List<Message> items = new ArrayList<>();

  public void add(Message m) {
    items.add(m);
    notifyItemInserted(items.size() - 1);
  }

  @NonNull @Override public Holder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
    View v = LayoutInflater.from(parent.getContext()).inflate(android.R.layout.simple_list_item_1, parent, false);
    return new Holder(v);
  }

  @Override public void onBindViewHolder(@NonNull Holder holder, int position) {
    holder.text.setText(items.get(position).text);
  }

  @Override public int getItemCount() { return items.size(); }

  static class Holder extends RecyclerView.ViewHolder {
    TextView text;
    Holder(@NonNull View itemView) { super(itemView); text = itemView.findViewById(android.R.id.text1); }
  }
}