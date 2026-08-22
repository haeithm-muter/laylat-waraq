/** Maps Firebase Auth error codes to Arabic messages shown in the UI. */
export function mapAuthErrorToArabic(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';

  switch (code) {
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صحيحة';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مستخدم بالفعل';
    case 'auth/weak-password':
      return 'كلمة المرور ضعيفة، اختر كلمة مرور أقوى (6 أحرف على الأقل)';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة، حاول مرة أخرى بعد قليل';
    case 'auth/network-request-failed':
      return 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'ERR_REQUEST_CANCELED':
      return 'تم إلغاء تسجيل الدخول';
    case 'auth/not-configured':
      return 'لم يتم إعداد تسجيل الدخول بعد. يرجى إضافة إعدادات Firebase (راجع ملف .env.example)';
    default:
      return 'حدث خطأ غير متوقع، حاول مرة أخرى';
  }
}
