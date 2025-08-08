# Qwen Code Mobile (Android)

Android app providing a GUI for the Qwen Code CLI.

Highlights:
- Material 3 UI: empty state, task history, chat interface
- Planned: integrated repository browser and code editor
- Planned: Node.js Mobile + JNI bridge to run the CLI inside the app and connect UI actions to CLI commands

Development notes:
- Open in Android Studio, sync Gradle
- Java 17, minSdk 26, target 35
- Next steps: integrate Node.js Mobile, create JNI bridge, start the CLI with proper args, stream outputs to the chat UI