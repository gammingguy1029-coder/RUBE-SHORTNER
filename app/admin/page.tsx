import { isAdmin } from "@/lib/session";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";

export default async function AdminPage() {
  const admin = await isAdmin();
  return (
    <main className="max-w-lg mx-auto p-6">
      {admin ? <Dashboard /> : <LoginForm />}
    </main>
  );
}
