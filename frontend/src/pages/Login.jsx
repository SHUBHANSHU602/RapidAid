import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Ambulance } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { connectSocket } from '../services/socket';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const roleRoutes = { USER: '/dashboard', DRIVER: '/driver', ADMIN: '/admin' };

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await login(email, password);
      connectSocket();
      toast.success('Login successful!');
      navigate(roleRoutes[role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-bg-card border-r border-border-light flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-accent-red/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-64 h-64 bg-accent-blue/10 rounded-full blur-[100px]" />

        <div className="relative z-10 text-center space-y-8">
          <div className="w-20 h-20 bg-accent-red rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-accent-red/30">
            <Ambulance className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold">
            Rapid<span className="text-accent-red">Aid</span>
          </h1>
          <p className="text-text-muted text-lg leading-relaxed max-w-xs">
            Emergency response reimagined with AI-powered dispatch
          </p>
          <div className="text-6xl">🚑</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md p-8 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-12 h-12 bg-accent-red rounded-xl flex items-center justify-center">
                <Ambulance className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-text-muted text-sm">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              icon={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted">
            New here?{' '}
            <Link to="/register" className="text-accent-red hover:text-accent-red-hover font-medium transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
