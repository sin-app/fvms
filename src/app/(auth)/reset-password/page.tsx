import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan email untuk menerima instruksi reset password
        </p>
      </div>
      <ResetPasswordForm />
      <p className="text-center text-xs text-muted-foreground">
        <a href="/login" className="hover:text-primary">
          Kembali ke Login
        </a>
      </p>
    </div>
  );
}
