import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">FVMS</h1>
        <p className="text-sm text-muted-foreground">
          Field Visit Management System
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
