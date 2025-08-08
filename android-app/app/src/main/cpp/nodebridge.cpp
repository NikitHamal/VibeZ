#include <jni.h>
#include <string>
#include <vector>
#include <android/log.h>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "nodebridge", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "nodebridge", __VA_ARGS__)

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

  // TODO: Integrate Node.js Mobile runtime here, e.g.:
  // int code = node::Start(argc, argv); or node::Start(args_vector);
  // Also wire a custom console that calls back to onStdout/onStderr.

  jstring msg = env->NewStringUTF("Node Mobile start stub: replace with node::Start and console bridge.");
  env->CallVoidMethod(listener, onStdout, msg);
  env->DeleteLocalRef(msg);

  env->CallVoidMethod(listener, onExit, 0);
  return 0;
}