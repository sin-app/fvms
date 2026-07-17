import { UpdatePasswordForm } from "@/features/auth/components/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Buat Password Baru</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan password baru Anda
        </p>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
