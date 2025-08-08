#include <jni.h>
#include <string>
#include <android/log.h>

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "nodebridge", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "nodebridge", __VA_ARGS__)

// In a proper Node.js Mobile setup, you'd call into node::Start with an argv that includes the asset path
// and ensure the Node runtime reads from assets. Here we simulate by notifying stdout and immediate exit.

extern "C" JNIEXPORT jint JNICALL
Java_ai_qwen_code_NodeBridge_startNodeWithArgs(
    JNIEnv* env,
    jclass /*clazz*/,
    jobjectArray jargs,
    jobject listener) {
  jclass listenerCls = env->GetObjectClass(listener);
  jmethodID onStdout = env->GetMethodID(listenerCls, "onStdout", "(Ljava/lang/String;)V");
  jmethodID onExit = env->GetMethodID(listenerCls, "onExit", "(I)V");

  jstring msg = env->NewStringUTF("Node Mobile integration point reached. Replace stub with node::Start and asset FS." );
  env->CallVoidMethod(listener, onStdout, msg);
  env->DeleteLocalRef(msg);

  env->CallVoidMethod(listener, onExit, 0);
  return 0;
}