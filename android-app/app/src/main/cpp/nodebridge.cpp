#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "nodebridge", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "nodebridge", __VA_ARGS__)

// If node headers are available (from Node Mobile), include them to call node::Start
// #include <node.h>
// #include <uv.h>

extern "C" JNIEXPORT jint JNICALL
Java_ai_qwen_code_NodeBridge_startNodeWithArgs(
    JNIEnv* env,
    jclass /*clazz*/,
    jobjectArray jargs,
    jobject listener) {
  jclass listenerCls = env->GetObjectClass(listener);
  jmethodID onStdout = env->GetMethodID(listenerCls, "onStdout", "(Ljava/lang/String;)V");
  jmethodID onStderr = env->GetMethodID(listenerCls, "onStderr", "(Ljava/lang/String;)V");
  jmethodID onExit = env->GetMethodID(listenerCls, "onExit", "(I)V");

  // Collect argv
  jsize argc = env->GetArrayLength(jargs);
  std::vector<std::string> args;
  args.reserve(argc);
  for (jsize i = 0; i < argc; ++i) {
    jstring s = (jstring) env->GetObjectArrayElement(jargs, i);
    const char* cstr = env->GetStringUTFChars(s, nullptr);
    args.emplace_back(cstr ? cstr : "");
    env->ReleaseStringUTFChars(s, cstr);
    env->DeleteLocalRef(s);
  }

  int exit_code = 0;

  // Option A (recommended): patch console.log in index.js to forward to a Java bridge.
  // Option B (native): redirect stdout/stderr via libuv to call onStdout/onStderr.

  // Pseudo-implementation (compile guards):
#if defined(HAVE_NODE_MOBILE)
  // Build argv for node::Start
  std::vector<char*> argv;
  argv.reserve(args.size() + 1);
  // First arg is a program name
  argv.push_back(const_cast<char*>("node"));
  for (auto &a : args) argv.push_back(const_cast<char*>(a.c_str()));

  // TODO: setup uv pipe hooks to capture stdout/stderr and call back to Java
  // This requires integrating with Node's libuv loop and setting custom write callbacks.

  exit_code = node::Start(argv.size(), argv.data());
#else
  // Fallback if Node Mobile headers/libs not linked: notify and exit
  {
    jstring msg = env->NewStringUTF("Node Mobile not linked. Define HAVE_NODE_MOBILE and link node to run.");
    env->CallVoidMethod(listener, onStderr, msg);
    env->DeleteLocalRef(msg);
  }
  exit_code = -1;
#endif

  env->CallVoidMethod(listener, onExit, exit_code);
  return exit_code;
}