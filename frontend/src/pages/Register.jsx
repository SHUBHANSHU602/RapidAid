import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Ambulance, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { connectSocket } from '../services/socket';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const roleRoutes = { USER: '/dashboard', DRIVER: '/driver', ADMIN: '/admin' };

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = await register(formData.name, formData.email, formData.password, formData.role);
      connectSocket();
      toast.success('Account created successfully!');
      navigate(roleRoutes[role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <div className="space-y-4 max-w-sm text-left mx-auto">
            <div className="glass p-4 rounded-xl flex gap-3">
              <ShieldAlert className="w-6 h-6 text-accent-red shrink-0" />
              <p className="text-sm text-text-muted">Instant AI triage matches you with the nearest ambulance in under 300ms.</p>
            </div>
            <div className="glass p-4 rounded-xl flex gap-3">
              <Ambulance className="w-6 h-6 text-accent-blue shrink-0" />
              <p className="text-sm text-text-muted">Drivers get optimized routing and automatic delay fallbacks.</p>
            </div>
          </div>
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
            <h2 className="text-2xl font-bold">Create Account</h2>
            <p className="text-text-muted text-sm">Join the RapidAid network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              icon={User}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              icon={Lock}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-muted">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'USER' })}
                  className={`
                    p-3 rounded-xl border transition-all
                    ${formData.role === 'USER' 
                      ? 'bg-accent-red/20 border-accent-red text-text-primary' 
                      : 'bg-bg-elevated border-border-light text-text-muted hover:bg-bg-elevated/80'}
                  `}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'DRIVER' })}
                  className={`
                    p-3 rounded-xl border transition-all
                    ${formData.role === 'DRIVER' 
                      ? 'bg-accent-blue/20 border-accent-blue text-text-primary' 
                      : 'bg-bg-elevated border-border-light text-text-muted hover:bg-bg-elevated/80'}
                  `}
                >
                  Driver
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-red hover:text-accent-red-hover font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
