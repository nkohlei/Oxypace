# Add project specific ProGuard rules here.

# Capacitor & Native Plugins
-keep class com.getcapacitor.** { *; }
-keep class com.oxypace.app.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.CapacitorPlugin public *;
}

# LiveKit & WebRTC
-keep class io.livekit.android.** { *; }
-keep class org.webrtc.** { *; }
-dontwarn io.livekit.android.**
-dontwarn org.webrtc.**

# Gson & Jackson
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.Unsafe

# Firebase Messaging (FCM)
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Kotlin Reflection & Coroutines
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.coroutines.**

# OkHttp (WebSocket / Socket.IO transport)
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Capacitor Plugin interfaces (prevent stripping plugin bridge methods)
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# Preserve line numbers and source file attributes for stack traces
-keepattributes SourceFile,LineNumberTable
-keepattributes EnclosingMethod,InnerClasses
-dontwarn javax.annotation.**
-dontwarn org.bouncycastle.**
-dontwarn android.window.**
