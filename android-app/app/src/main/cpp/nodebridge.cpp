#include <jni.h>
#include <string>
#include <android/log.h>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "nodebridge", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "nodebridge", __VA_ARGS__)

extern "C" JNIEXPORT jint JNICALL
Java_ai_qwen_code_NodeBridge_startNodeWithArgs(
    JNIEnv* env,
    jclass /*clazz*/,
    jobjectArray jargs,
    jobject listener) {
  // TODO: integrate with Node.js Mobile entry point; for now, simulate
  jclass listenerCls = env->GetObjectClass(listener);
  jmethodID onStdout = env->GetMethodID(listenerCls, "onStdout", "(Ljava/lang/String;)V");
  jmethodID onStderr = env->GetMethodID(listenerCls, "onStderr", "(Ljava/lang/String;)V");
  jmethodID onExit = env->GetMethodID(listenerCls, "onExit", "(I)V");

  jstring msg = env->NewStringUTF("Node placeholder started. Integrate Node.js Mobile here.");
  env->CallVoidMethod(listener, onStdout, msg);
  env->DeleteLocalRef(msg);

  env->CallVoidMethod(listener, onExit, 0);
  return 0;
}