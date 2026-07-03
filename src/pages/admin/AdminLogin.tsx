import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../admin/AuthContext";
import Logo from "../../components/Logo";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";

export default function AdminLogin() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-8">
            <Logo variant="dark" />
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-neutral-400 text-sm">Sign in to the Phantastic Publishing admin panel</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@phantasticpub.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-neutral-900 py-3 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Public registration is disabled. New admin accounts are created by a super_admin.
        </p>
      </div>
    </div>
  );
}
