import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold">Entrar en Whiterock</h1>
      <p className="text-sm text-zinc-600 mt-2">Te enviamos un magic link por email. Sin contraseñas, sin Google.</p>
      <form
        action={async (formData: FormData) => {
          "use server";
          const email = formData.get("email") as string;
          await signIn("nodemailer", { email, redirectTo: "/" });
        }}
        className="mt-6 space-y-4"
      >
        <input name="email" type="email" required placeholder="tu@email.es" className="w-full border rounded-xl px-3 py-2.5 text-sm" />
        <button type="submit" className="w-full bg-black text-white rounded-xl py-2.5 font-semibold">Enviar magic link</button>
      </form>
      <p className="text-xs text-zinc-500 mt-4">Si no configuras SMTP, el link se loguea en consola del servidor (<code>docker logs web</code> o <code>npm run dev</code>).</p>
      <p className="text-xs text-zinc-500 mt-2">Admins: <code>ADMIN_EMAILS</code> para /admin/ingest.</p>
    </div>
  );
}
