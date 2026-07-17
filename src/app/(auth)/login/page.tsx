import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

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
