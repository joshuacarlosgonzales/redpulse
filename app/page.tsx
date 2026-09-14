// app/page.tsx (updated with Cloudflare Turnstile & OTP Password Reset)
"use client";

import {
useEffect,
useRef,
useState,
type FormEvent,
type RefObject,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
Heart,
ShieldCheck,
Search,
Bell,
Users,
Droplet,
Droplets,
Building2,
Activity,
BarChart3,
ArrowRight,
UserPlus,
Check,
Menu,
X,
MapPin,
Mail,
LogIn,
Lock,
Eye,
EyeOff,
Loader2,
LayoutDashboard,
AlertCircle,
Shield,
ArrowLeft,
CheckCircle,
Key,
} from "lucide-react";
import {
FaInstagram,
FaLinkedinIn,
FaXTwitter,
} from "react-icons/fa6";
import { useRouter } from "next/navigation";
import DonorRegisterModal from "@/components/modals/DonorRegisterModal";
import HospitalRegisterModal from "@/components/modals/HospitalRegisterModal";
import Script from 'next/script';
import {
InputOTP,
InputOTPGroup,
InputOTPSlot,
} from "@/components/ui/input-otp";
import { Logos19 } from "@/components/logos19";

/* =========================================================
TYPES
========================================================= */

type SectionId =
| "home"
| "about"
| "how-it-works"
| "features"
| "impact"
| "contact";

// Turnstile interface
interface Turnstile {
render: (container: HTMLElement, options: any) => string;
reset: (widgetId: string) => void;
remove: (widgetId: string) => void;
}

declare global {
interface Window {
turnstile: Turnstile;
}
}

/* =========================================================
ANIMATIONS
========================================================= */

const fadeUp: Variants = {
hidden: { opacity: 0, y: 25 },
visible: {
opacity: 1,
y: 0,
transition: { duration: 0.6, ease: "easeOut" },
},
};

const stagger: Variants = {
hidden: { opacity: 0 },
visible: {
opacity: 1,
transition: { staggerChildren: 0.08, delayChildren: 0.1 },
},
};

/* =========================================================
NAVIGATION
========================================================= */

const navLinks: { label: string; id: SectionId }[] = [
{ label: "Home", id: "home" },
{ label: "About", id: "about" },
{ label: "How It Works", id: "how-it-works" },
{ label: "Features", id: "features" },
{ label: "Impact", id: "impact" },
{ label: "Contact", id: "contact" },
];

/* =========================================================
DATA
========================================================= */

const stats = [
{ icon: Users, value: "15,892+", title: "Registered Donors", description: "Heroes in our community" },
{ icon: Droplet, value: "28,450+", title: "Blood Donations", description: "Units donated so far" },
{ icon: Building2, value: "320+", title: "Partner Hospitals", description: "Across the country" },
{ icon: Activity, value: "50,000+", title: "Lives Impacted", description: "And counting every day" },
];

const features = [
{ icon: ShieldCheck, title: "Secure & Reliable", description: "Your donor and hospital information is protected with secure access controls." },
{ icon: Activity, title: "Real-time Updates", description: "Monitor blood availability and important requests with up-to-date information." },
{ icon: Search, title: "Easy Matching", description: "Connect blood requests with compatible available blood resources efficiently." },
{ icon: Heart, title: "Save More Lives", description: "Make blood donation easier and help communities respond when blood is needed." },
{ icon: BarChart3, title: "Smart Analytics", description: "Hospitals can monitor inventory and use reports to make better decisions." },
{ icon: Bell, title: "Emergency Ready", description: "Keep blood information organized so urgent requests can be handled faster." },
];

const steps = [
{ number: "01", icon: UserPlus, title: "Register", description: "Create your account as a donor or hospital in just a few simple steps." },
{ number: "02", icon: Droplet, title: "Donate / Request", description: "Donate blood or submit a blood request when blood is needed." },
{ number: "03", icon: Activity, title: "Save Lives", description: "Every successful donation and request contributes to a healthier community." },
];

const checklist = [
"Donor Management",
"Blood Donor Tracking",
"Blood Request & Matching",
"Inventory Management",
"Reports & Analytics",
];

const bloodInventory = [
{ type: "A+", percentage: 85 },
{ type: "A-", percentage: 62 },
{ type: "B+", percentage: 78 },
{ type: "B-", percentage: 45 },
{ type: "O+", percentage: 90 },
{ type: "O-", percentage: 55 },
{ type: "AB+", percentage: 68 },
{ type: "AB-", percentage: 40 },
];

const recentRequests = [
{ type: "A+", units: "2 Units", hospital: "City Hospital", time: "10 min ago" },
{ type: "O-", units: "1 Unit", hospital: "General Hospital", time: "25 min ago" },
{ type: "B+", units: "3 Units", hospital: "Metro Hospital", time: "1 hr ago" },
];

/* =========================================================
COMPONENT
========================================================= */

export default function HomePage() {
const router = useRouter();

const [activeSection, setActiveSection] = useState<SectionId>("home");
const [menuOpen, setMenuOpen] = useState(false);
const [showLogin, setShowLogin] = useState(false);
const [showRegister, setShowRegister] = useState(false);
const [showDonorRegister, setShowDonorRegister] = useState(false);
const [showHospitalRegister, setShowHospitalRegister] = useState(false);

// Forgot Password States
const [showForgotPassword, setShowForgotPassword] = useState(false);
const [showOtpInput, setShowOtpInput] = useState(false);
const [showResetPassword, setShowResetPassword] = useState(false);
const [showPasswordResetSent, setShowPasswordResetSent] = useState(false);

// Login States
const [showPassword, setShowPassword] = useState(false);
const [isLoading, setIsLoading] = useState(false);
const [loginError, setLoginError] = useState("");
const [loginData, setLoginData] = useState({ email: "", password: "" });

// Login Turnstile
const [turnstileToken, setTurnstileToken] = useState<string>("");
const [turnstileWidgetId, setTurnstileWidgetId] = useState<string>("");
const turnstileRef = useRef<HTMLDivElement>(null);
const [turnstileLoaded, setTurnstileLoaded] = useState(false);

// Forgot Password States
const [forgotEmail, setForgotEmail] = useState("");
const [otpCode, setOtpCode] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [forgotIsLoading, setForgotIsLoading] = useState(false);
const [forgotError, setForgotError] = useState("");
const [otpTimer, setOtpTimer] = useState<number>(0);
const [resendDisabled, setResendDisabled] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

// Forgot Password Turnstile
const [forgotTurnstileToken, setForgotTurnstileToken] = useState<string>("");
const [forgotTurnstileWidgetId, setForgotTurnstileWidgetId] = useState<string>("");
const forgotTurnstileRef = useRef<HTMLDivElement>(null);
const [forgotTurnstileLoaded, setForgotTurnstileLoaded] = useState(false);

const homeRef = useRef<HTMLElement | null>(null);
const aboutRef = useRef<HTMLElement | null>(null);
const howRef = useRef<HTMLElement | null>(null);
const featuresRef = useRef<HTMLDivElement | null>(null);
const impactRef = useRef<HTMLElement | null>(null);
const contactRef = useRef<HTMLElement | null>(null);

const particles = Array.from({ length: 24 });

// Timer for OTP expiry
useEffect(() => {
let interval: NodeJS.Timeout;
if (showOtpInput && otpTimer > 0) {
interval = setInterval(() => {
setOtpTimer((prev) => {
if (prev <= 1) {
clearInterval(interval);
setResendDisabled(false);
return 0;
}
return prev - 1;
});
}, 1000);
}
return () => clearInterval(interval);
}, [showOtpInput, otpTimer]);

// Initialize Login Turnstile
useEffect(() => {
if (showLogin && turnstileLoaded && turnstileRef.current && !turnstileWidgetId) {
try {
const widgetId = window.turnstile.render(turnstileRef.current, {
sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
callback: (token: string) => {
setTurnstileToken(token);
},
'expired-callback': () => {
setTurnstileToken('');
},
'error-callback': () => {
setLoginError('Security verification failed. Please refresh and try again.');
},
theme: 'dark',
size: 'normal',
});
setTurnstileWidgetId(widgetId);
} catch (err) {
console.error('Turnstile initialization error:', err);
}
}

return () => {
  if (turnstileWidgetId && window.turnstile) {
    try {
      window.turnstile.remove(turnstileWidgetId);
    } catch (err) {
      console.error('Error removing turnstile:', err);
    }
  }
};

}, [showLogin, turnstileLoaded, turnstileWidgetId]);

// Initialize Forgot Password Turnstile
useEffect(() => {
if (showForgotPassword && !showOtpInput && forgotTurnstileLoaded && forgotTurnstileRef.current && !forgotTurnstileWidgetId) {
try {
const widgetId = window.turnstile.render(forgotTurnstileRef.current, {
sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
callback: (token: string) => {
setForgotTurnstileToken(token);
},
'expired-callback': () => {
setForgotTurnstileToken('');
},
'error-callback': () => {
setForgotError('Security verification failed. Please refresh and try again.');
},
theme: 'dark',
size: 'normal',
});
setForgotTurnstileWidgetId(widgetId);
} catch (err) {
console.error('Turnstile initialization error:', err);
}
}

return () => {
  if (forgotTurnstileWidgetId && window.turnstile) {
    try {
      window.turnstile.remove(forgotTurnstileWidgetId);
    } catch (err) {
      console.error('Error removing turnstile:', err);
    }
  }
};

}, [showForgotPassword, showOtpInput, forgotTurnstileLoaded, forgotTurnstileWidgetId]);

// Reset Turnstile functions
const resetLoginTurnstile = () => {
if (turnstileWidgetId && window.turnstile) {
window.turnstile.reset(turnstileWidgetId);
setTurnstileToken('');
}
};

const resetForgotTurnstile = () => {
if (forgotTurnstileWidgetId && window.turnstile) {
window.turnstile.reset(forgotTurnstileWidgetId);
setForgotTurnstileToken('');
}
};

useEffect(() => {
if (showLogin || showForgotPassword || showDonorRegister || showHospitalRegister || menuOpen) {
document.body.style.overflow = "hidden";
} else {
document.body.style.overflow = "";
}
return () => {
document.body.style.overflow = "";
};
}, [showLogin, showForgotPassword, showDonorRegister, showHospitalRegister, menuOpen]);

useEffect(() => {
const sections: { id: SectionId; ref: RefObject<HTMLElement | null> }[] = [
{ id: "home", ref: homeRef },
{ id: "about", ref: aboutRef },
{ id: "how-it-works", ref: howRef },
{ id: "features", ref: featuresRef },
{ id: "impact", ref: impactRef },
{ id: "contact", ref: contactRef },
];

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveSection(entry.target.id as SectionId);
      }
    });
  },
  { threshold: 0.35, rootMargin: "-80px 0px -25% 0px" }
);

sections.forEach(({ ref }) => {
  if (ref.current) observer.observe(ref.current);
});

return () => observer.disconnect();

}, []);

const scrollToSection = (id: SectionId) => {
const elements: Record<SectionId, HTMLElement | null> = {
home: homeRef.current,
about: aboutRef.current,
"how-it-works": howRef.current,
features: featuresRef.current,
impact: impactRef.current,
contact: contactRef.current,
};
elements[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
setMenuOpen(false);
};

// Login Handler with Turnstile
const handleLogin = async (e: FormEvent) => {
e.preventDefault();
setIsLoading(true);
setLoginError("");

if (!turnstileToken) {
  setLoginError("Please complete the security verification");
  setIsLoading(false);
  return;
}

try {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      ...loginData,
      turnstileToken 
    }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    setShowLogin(false);
    resetLoginTurnstile();
    const user = data.data.user;
    if (user.role === "admin") {
      router.push("/admin/dashboard");
    } else if (user.role === "hospital") {
      router.push("/hospital/dashboard");
    } else if (user.role === "donor") {
      router.push("/donors/dashboard");
    } else {
      router.push("/dashboard");
    }
  } else {
    setLoginError(data.error || "Invalid email or password.");
    resetLoginTurnstile();
  }
} catch {
  setLoginError("Unable to connect to the server. Please try again.");
  resetLoginTurnstile();
} finally {
  setIsLoading(false);
}

};

// Step 1: Send OTP (with Turnstile)
const handleSendOTP = async (e: FormEvent) => {
e.preventDefault();
setForgotIsLoading(true);
setForgotError("");

if (!forgotEmail) {
  setForgotError("Please enter your email address");
  setForgotIsLoading(false);
  return;
}

if (!forgotTurnstileToken) {
  setForgotError("Please complete the security verification");
  setForgotIsLoading(false);
  return;
}

try {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: forgotEmail,
      turnstileToken: forgotTurnstileToken 
    }),
  });

  const data = await response.json();

  if (data.success) {
    setShowOtpInput(true);
    setOtpTimer(60);
    setResendDisabled(true);
    setForgotError("");
    resetForgotTurnstile();
  } else {
    setForgotError(data.error || "Something went wrong. Please try again.");
    resetForgotTurnstile();
  }
} catch {
  setForgotError("An error occurred. Please try again.");
  resetForgotTurnstile();
} finally {
  setForgotIsLoading(false);
}

};

// Step 2: Enter the 6-digit OTP
const handleVerifyOTP = async (e: FormEvent) => {
e.preventDefault();
setForgotError("");

if (!otpCode || otpCode.length !== 6) {
  setForgotError("Please enter a valid 6-digit code");
  return;
}

if (!forgotEmail) {
  setForgotError("Email is required");
  return;
}

setShowOtpInput(false);
setShowResetPassword(true);
setForgotError("");

};

// Step 3: Reset Password
const handleResetPassword = async (e: FormEvent) => {
e.preventDefault();
setForgotIsLoading(true);
setForgotError("");

if (newPassword.length < 6) {
  setForgotError("Password must be at least 6 characters");
  setForgotIsLoading(false);
  return;
}

if (newPassword !== confirmPassword) {
  setForgotError("Passwords do not match");
  setForgotIsLoading(false);
  return;
}

if (!forgotEmail || !otpCode) {
  setForgotError("Missing required information");
  setForgotIsLoading(false);
  return;
}

try {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: forgotEmail,
      otp: otpCode,
      newPassword: newPassword 
    }),
  });

  const data = await response.json();

  if (data.success) {
    setShowResetPassword(false);
    setShowPasswordResetSent(true);
    setForgotError("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setShowForgotPassword(false);
      setShowPasswordResetSent(false);
      setShowLogin(true);
      setForgotEmail("");
      setOtpCode("");
      setShowOtpInput(false);
      setShowResetPassword(false);
    }, 3000);
  } else {
    setForgotError(data.error || "Failed to reset password");
  }
} catch {
  setForgotError("An error occurred. Please try again.");
} finally {
  setForgotIsLoading(false);
}

};

// Resend OTP
const handleResendOTP = async () => {
setForgotIsLoading(true);
setForgotError("");

try {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email: forgotEmail,
      resend: true 
    }),
  });

  const data = await response.json();

  if (data.success) {
    setOtpTimer(60);
    setResendDisabled(true);
    setOtpCode("");
    setForgotError("");
  } else {
    setForgotError(data.error || "Failed to resend code.");
  }
} catch {
  setForgotError("An error occurred. Please try again.");
} finally {
  setForgotIsLoading(false);
}

};

const handleRegisterClick = () => {
setShowRegister(true);
};

const handleSelectDonor = () => {
setShowRegister(false);
setShowDonorRegister(true);
};

const handleSelectHospital = () => {
setShowRegister(false);
setShowHospitalRegister(true);
};

const closeForgotPassword = () => {
setShowForgotPassword(false);
setForgotEmail("");
setForgotError("");
setShowOtpInput(false);
setShowResetPassword(false);
setShowPasswordResetSent(false);
setOtpCode("");
setNewPassword("");
setConfirmPassword("");
setOtpTimer(0);
setResendDisabled(false);
resetForgotTurnstile();
};

const openForgotPassword = () => {
setShowLogin(false);
setShowForgotPassword(true);
setForgotError("");
setShowOtpInput(false);
setShowResetPassword(false);
setShowPasswordResetSent(false);
setOtpCode("");
setNewPassword("");
setConfirmPassword("");
setOtpTimer(0);
setResendDisabled(false);
resetForgotTurnstile();
};

const backToLogin = () => {
setShowForgotPassword(false);
setShowLogin(true);
setForgotEmail("");
setForgotError("");
setShowOtpInput(false);
setShowResetPassword(false);
setShowPasswordResetSent(false);
setOtpCode("");
setNewPassword("");
setConfirmPassword("");
setOtpTimer(0);
setResendDisabled(false);
resetForgotTurnstile();
};

const goBackToEmail = () => {
setShowOtpInput(false);
setShowResetPassword(false);
setShowPasswordResetSent(false);
setOtpCode("");
setNewPassword("");
setConfirmPassword("");
setForgotError("");
setOtpTimer(0);
setResendDisabled(false);
setTimeout(() => {
if (forgotTurnstileRef.current && forgotTurnstileLoaded) {
resetForgotTurnstile();
const widgetId = window.turnstile.render(forgotTurnstileRef.current, {
sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
callback: (token: string) => {
setForgotTurnstileToken(token);
},
'expired-callback': () => {
setForgotTurnstileToken('');
},
'error-callback': () => {
setForgotError('Security verification failed. Please refresh and try again.');
},
theme: 'dark',
size: 'normal',
});
setForgotTurnstileWidgetId(widgetId);
}
}, 100);
};

// Format timer
const formatTime = (seconds: number) => {
  return `${seconds}s`;
};

// Clear Turnstile on close
useEffect(() => {
if (!showForgotPassword && forgotTurnstileWidgetId && window.turnstile) {
try {
window.turnstile.remove(forgotTurnstileWidgetId);
setForgotTurnstileWidgetId('');
setForgotTurnstileToken('');
} catch (err) {
console.error('Error removing turnstile:', err);
}
}
}, [showForgotPassword, forgotTurnstileWidgetId]);

return (
<main className="min-h-screen bg-[#020303] text-white overflow-x-hidden">
{/* Cloudflare Turnstile Script */}
<Script
src="https://challenges.cloudflare.com/turnstile/v0/api.js"
async
defer
onLoad={() => {
setTurnstileLoaded(true);
setForgotTurnstileLoaded(true);
}}
/>

  {/* GLOBAL BACKGROUND */}
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-red-900/10 blur-[140px]" />
    <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-red-950/10 blur-[150px]" />
    {particles.map((_, index) => (
      <motion.span
        key={index}
        className="absolute w-1 h-1 rounded-full bg-red-500/40"
        style={{ left: `${(index * 37) % 100}%`, top: `${(index * 61) % 100}%` }}
        animate={{ opacity: [0.15, 0.7, 0.15], scale: [0.7, 1.5, 0.7] }}
        transition={{ duration: 3 + (index % 4), repeat: Infinity, delay: index * 0.15 }}
      />
    ))}
  </div>

  {/* NAVBAR */}
  <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/[0.06] bg-[#020303]/80 backdrop-blur-xl">
    <div className="max-w-[1400px] mx-auto h-[76px] px-4 sm:px-6 lg:px-10 flex items-center justify-between">
      <button type="button" onClick={() => scrollToSection("home")} className="flex items-center gap-2 group">
        <div className="relative w-8 h-9 flex items-center justify-center">
          <Droplet className="w-8 h-8 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor" />
          <Activity className="absolute w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Red<span className="text-red-500">Pulse</span>
        </span>
      </button>

      <nav className="hidden lg:flex items-center gap-8">
        {navLinks.map((link) => (
          <button
            type="button"
            key={link.id}
            onClick={() => scrollToSection(link.id)}
            className={`relative text-[13px] font-medium transition-colors ${
              activeSection === link.id ? "text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {link.label}
            {activeSection === link.id && (
              <motion.span layoutId="nav-active" className="absolute -bottom-2 left-0 right-0 h-[2px] bg-red-500" />
            )}
          </button>
        ))}
      </nav>

      <div className="hidden lg:flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setLoginError("");
            setShowLogin(true);
          }}
          className="px-5 py-2.5 rounded-xl border border-white/20 text-sm font-medium hover:bg-white/5 transition"
        >
          Log In
        </button>
        <button
          type="button"
          onClick={handleRegisterClick}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold transition shadow-lg shadow-red-950/40"
        >
          Sign Up
        </button>
      </div>

      <button type="button" onClick={() => setMenuOpen(true)} className="lg:hidden p-2" aria-label="Open menu">
        <Menu className="w-6 h-6" />
      </button>
    </div>
  </header>

  {/* MOBILE MENU */}
  <AnimatePresence>
    {menuOpen && (
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        className="fixed inset-0 z-50 bg-[#030404]"
      >
        <button type="button" onClick={() => setMenuOpen(false)} className="absolute top-6 right-6" aria-label="Close menu">
          <X className="w-7 h-7" />
        </button>
        <div className="h-full flex flex-col items-center justify-center gap-7">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`text-2xl font-semibold ${activeSection === link.id ? "text-red-500" : "text-white"}`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-5 flex flex-col gap-3 w-64">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setLoginError("");
                setShowLogin(true);
              }}
              className="w-full py-3 rounded-xl border border-white/20"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                handleRegisterClick();
              }}
              className="w-full py-3 rounded-xl bg-red-600"
            >
              Sign Up
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* HERO */}
  <section id="home" ref={homeRef} className="relative z-10 pt-32 lg:pt-36 pb-16 px-4 sm:px-6 lg:px-10 scroll-mt-20">
    <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10 items-center">
      {/* LEFT */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10">
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-[11px] tracking-wide text-white/75 mb-6"
        >
          <Activity className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} />
          SAVE LIVES. DONATE BLOOD.
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-[72px] font-bold tracking-[-0.04em] leading-[0.98]">
          Every Drop
          <br />
          Creates <span className="text-red-500">Hope</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="mt-7 max-w-[530px] text-base lg:text-lg leading-7 text-white/55">
          RedPulse connects generous donors with those in need. Together, we can build a stronger, healthier
          community one donation at a time.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRegisterClick}
            className="group inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 px-6 py-3.5 rounded-xl font-semibold text-sm transition shadow-xl shadow-red-950/40"
          >
            Become a Donor
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("about")}
            className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/[0.04] font-medium text-sm transition"
          >
            Explore RedPulse
            <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
              <ArrowRight className="w-3 h-3 text-red-500" />
            </span>
          </button>
        </motion.div>
      </motion.div>

      {/* RIGHT HERO ART - Mobile Responsive */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, x: 30 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative h-[300px] sm:h-[400px] lg:h-[560px] flex items-center justify-center overflow-visible"
      >
        {/* HEARTBEAT - responsive SVG */}
        <svg viewBox="0 0 900 180" className="absolute inset-0 w-full h-full pointer-events-none" fill="none" preserveAspectRatio="none">
          <motion.path
            d="M0 90 H145 L175 90 L195 82 L215 90 L232 90 L252 35 L270 145 L292 90 H390 L410 90 L430 72 L450 90 L468 90 L488 45 L505 135 L525 90 H900"
            stroke="#ef233c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
          />
          <motion.path
            d="M0 90 H145 L175 90 L195 82 L215 90 L232 90 L252 35 L270 145 L292 90 H390 L410 90 L430 72 L450 90 L468 90 L488 45 L505 135 L525 90 H900"
            stroke="#ef233c"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.08"
            filter="blur(6px)"
          />
        </svg>

        {/* MEDICAL LABEL - hidden on small mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute top-[15%] left-[3%] hidden sm:flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl px-3.5 py-2.5 shadow-2xl"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20">
            <Activity className="w-4 h-4 text-red-400" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Life Signal</p>
            <p className="text-xs font-medium text-white/80">Active Monitoring</p>
          </div>
        </motion.div>

        {/* BLOOD NETWORK - hidden on small mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute left-[2%] bottom-[16%] hidden sm:block"
        >
          <div className="relative rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl px-4 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20">
                <Droplets className="w-4 h-4 text-red-400" />
                <span className="absolute inset-0 rounded-full border border-red-400/20 animate-ping" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/35">Blood Network</p>
                <p className="text-xs font-semibold text-white/80">Connected</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* PARTICLES - responsive positioning */}
        {[
          { left: "12%", top: "25%" },
          { left: "82%", top: "16%" },
          { left: "18%", top: "70%" },
          { left: "76%", top: "68%" },
          { left: "29%", top: "14%" },
          { left: "69%", top: "30%" },
          { left: "14%", top: "48%" },
          { left: "86%", top: "45%" },
          { left: "35%", top: "82%" },
          { left: "60%", top: "83%" },
        ].map((position, index) => (
          <motion.span
            key={index}
            className="absolute rounded-full bg-red-400"
            style={{
              left: position.left,
              top: position.top,
              width: index % 3 === 0 ? 5 : 3,
              height: index % 3 === 0 ? 5 : 3,
              opacity: 0.35,
            }}
            animate={{ y: [-8, 8, -8], opacity: [0.2, 0.55, 0.2] }}
            transition={{ duration: 3 + index * 0.35, repeat: Infinity, ease: "easeInOut", delay: index * 0.2 }}
          />
        ))}

        {/* REALISTIC BLOOD DROP - responsive sizing */}
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10"
        >
          <svg 
            width="200" 
            height="280" 
            viewBox="0 0 300 390" 
            fill="none" 
            className="drop-shadow-[0_25px_45px_rgba(180,0,20,0.28)] w-[200px] h-[280px] sm:w-[250px] sm:h-[340px] lg:w-[300px] lg:h-[390px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="realBloodGradient" x1="80" y1="20" x2="220" y2="370" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ff7676" />
                <stop offset="0.18" stopColor="#f04444" />
                <stop offset="0.48" stopColor="#d71920" />
                <stop offset="0.78" stopColor="#9f0d13" />
                <stop offset="1" stopColor="#53070a" />
              </linearGradient>
              <linearGradient id="bloodDepth" x1="150" y1="180" x2="150" y2="370" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#8f0d12" stopOpacity="0" />
                <stop offset="1" stopColor="#350306" stopOpacity="0.65" />
              </linearGradient>
              <linearGradient id="bloodHighlight" x1="80" y1="60" x2="120" y2="210" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="white" stopOpacity="0.5" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <filter id="softBloodShadow" x="-30%" y="-30%" width="160%" height="170%">
                <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#8b0000" floodOpacity="0.32" />
              </filter>
              <filter id="bloodGlow">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <radialGradient id="bloodReflection">
                <stop offset="0" stopColor="white" stopOpacity="0.16" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="150" cy="330" rx="95" ry="22" fill="#e11d2e" opacity="0.12" filter="url(#bloodGlow)" />

            <path
              d="M150 12 C150 12 42 150 42 246 C42 315 87 364 150 364 C213 364 258 315 258 246 C258 150 150 12 150 12Z"
              fill="url(#realBloodGradient)"
              filter="url(#softBloodShadow)"
            />

            <path
              d="M44 244 C44 310 87 360 150 360 C213 360 256 310 256 244 C246 292 210 325 150 331 C90 325 54 292 44 244Z"
              fill="url(#bloodDepth)"
            />

            <path
              d="M105 94 C78 139 65 181 64 220 C63 238 66 251 73 260"
              stroke="url(#bloodHighlight)"
              strokeWidth="15"
              strokeLinecap="round"
              opacity="0.55"
            />

            <ellipse cx="91" cy="115" rx="25" ry="45" fill="url(#bloodReflection)" transform="rotate(25 91 115)" />
            <ellipse cx="185" cy="280" rx="45" ry="65" fill="#ff4b4b" opacity="0.07" />

            <foreignObject x="103" y="172" width="94" height="94">
              <div className="w-full h-full flex items-center justify-center">
                <Activity className="w-[68px] h-[68px] text-white/20" strokeWidth={2} />
              </div>
            </foreignObject>

            <path d="M104 282 C115 300 130 310 146 313" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.1" />
          </svg>
        </motion.div>

        {/* BLOOD BAG - hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block absolute top-[2%] right-[1%] lg:right-[4%] z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0], rotate: [0.5, -0.5, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="drop-shadow-[0_25px_35px_rgba(0,0,0,0.5)]"
          >
            <svg width="140" height="250" viewBox="0 0 170 300" fill="none">
              <defs>
                <linearGradient id="bagFluid" x1="20" y1="60" x2="150" y2="260" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#ff5b5b" />
                  <stop offset="0.4" stopColor="#d91f26" />
                  <stop offset="0.75" stopColor="#a4131a" />
                  <stop offset="1" stopColor="#5c0a0d" />
                </linearGradient>
                <linearGradient id="bagPlastic" x1="20" y1="40" x2="150" y2="270" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="white" stopOpacity="0.25" />
                  <stop offset="0.5" stopColor="white" stopOpacity="0.04" />
                  <stop offset="1" stopColor="white" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e6e6e6" />
                  <stop offset="1" stopColor="#8a8a8a" />
                </linearGradient>
                <filter id="bagShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="14" stdDeviation="14" floodColor="#000" floodOpacity="0.35" />
                </filter>
              </defs>

              <path d="M56 8 C56 40 56 55 56 55" stroke="#7a1013" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
              <path d="M114 8 C114 40 114 55 114 55" stroke="#7a1013" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
              <path
                d="M85 268 C85 300 60 320 40 345"
                stroke="#8f0d12"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.7"
              />

              <rect x="46" y="0" width="20" height="20" rx="4" fill="url(#portGrad)" />
              <rect x="104" y="0" width="20" height="20" rx="4" fill="url(#portGrad)" />

              <path
                d="M20 55 C20 45 30 38 42 38 H128 C140 38 150 45 150 55 V250 C150 272 130 290 105 290 H65 C40 290 20 272 20 250 Z"
                fill="url(#bagFluid)"
                filter="url(#bagShadow)"
              />

              <path d="M20 100 H150" stroke="#000" strokeOpacity="0.12" strokeWidth="1.5" />
              <path d="M20 165 H150" stroke="#000" strokeOpacity="0.12" strokeWidth="1.5" />
              <path d="M85 38 V290" stroke="#000" strokeOpacity="0.1" strokeWidth="1.5" />

              <path
                d="M20 55 C20 45 30 38 42 38 H128 C140 38 150 45 150 55 V250 C150 272 130 290 105 290 H65 C40 290 20 272 20 250 Z"
                fill="url(#bagPlastic)"
              />
              <path d="M34 55 C34 90 30 160 30 220" stroke="white" strokeOpacity="0.25" strokeWidth="10" strokeLinecap="round" />

              <rect x="34" y="110" width="102" height="92" rx="8" fill="white" />
              <foreignObject x="34" y="110" width="102" height="92">
                <div className="w-full h-full flex flex-col items-center justify-center px-2 text-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Droplet className="w-3 h-3 text-red-600" fill="currentColor" />
                    <svg width="26" height="10" viewBox="0 0 26 10">
                      <path d="M0 5 H6 L8 1 L10 9 L12 5 H26" stroke="#dc2626" strokeWidth="1.4" fill="none" />
                    </svg>
                  </div>
                  <p className="text-[9px] font-extrabold leading-tight text-zinc-900">DONATE</p>
                  <p className="text-[9px] font-extrabold leading-tight text-zinc-900">BLOOD</p>
                  <p className="text-[7px] font-semibold text-red-600 mt-0.5 tracking-wide">SAVE LIVES</p>
                  <div className="flex items-end gap-[1.5px] mt-2 h-3">
                    {[3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 3, 2].map((h, i) => (
                      <span key={i} className="bg-zinc-900" style={{ width: 1.4, height: `${h * 3}px` }} />
                    ))}
                  </div>
                  <p className="text-[5px] text-zinc-400 mt-0.5 tracking-widest">REDPULSE</p>
                </div>
              </foreignObject>
            </svg>
          </motion.div>
        </motion.div>

        {/* GROUND SHADOW */}
        <motion.div
          animate={{ scaleX: [1, 0.88, 1], opacity: [0.35, 0.2, 0.35] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[9%] left-1/2 -translate-x-1/2 w-[130px] sm:w-[190px] h-[20px] sm:h-[28px] rounded-[50%] bg-black/60 blur-xl"
        />
        <div className="absolute bottom-[7%] left-1/2 -translate-x-1/2 w-[160px] sm:w-[230px] h-[25px] sm:h-[35px] rounded-[50%] border border-white/[0.08]" />
      </motion.div>
    </div>
  </section>

{/* =========================================================
LOGOS / PARTNERS SECTION - moved above the Stats bar
========================================================= */}

<section className="relative z-10 py-12 sm:py-16 px-4 sm:px-6 lg:px-10 border-t border-white/[0.05] bg-transparent">
  <div className="max-w-[1320px] mx-auto">
    <div className="text-center mb-8 sm:mb-12">
      <p className="text-[11px] font-bold tracking-[0.25em] text-red-500 mb-3">TRUSTED PARTNERS</p>
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Supported by Leading Organizations</h2>
      <p className="mt-3 text-sm text-white/40 max-w-2xl mx-auto">
        RedPulse is proud to collaborate with these organizations to make blood donation more accessible.
      </p>
    </div>
    <Logos19 />
  </div>
</section>

  {/* STATS - Mobile Responsive */}
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.7 }}
    className="relative max-w-[1320px] mx-auto mt-2 mb-12 sm:mb-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.2)] mx-4 sm:mx-6 lg:mx-auto"
  >
    <div className="grid grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
            transition={{ duration: 0.2 }}
            className={`relative flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-4 sm:py-6 lg:px-7 lg:py-7 ${
              index !== 0 ? "border-l border-white/[0.07]" : ""
            } ${index >= 2 ? "border-t border-white/[0.07] lg:border-t-0" : ""}`}
          >
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.07]">
                <Icon className="h-[15px] w-[15px] sm:h-[18px] sm:w-[18px] text-red-400" />
              </div>
              <div className="absolute inset-0 rounded-xl bg-red-500/10 blur-md -z-10" />
            </div>
            <div className="min-w-0">
              <p className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight text-white">{stat.value}</p>
              <p className="mt-0.5 text-[10px] sm:text-xs lg:text-sm font-medium text-white/75 truncate">{stat.title}</p>
              <p className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] lg:text-xs text-white/35 truncate">{stat.description}</p>
            </div>
            {index < 3 && <div className="absolute right-0 top-1/2 hidden h-8 w-px -translate-y-1/2 bg-white/[0.04] lg:block" />}
          </motion.div>
        );
      })}
    </div>
  </motion.div>

  {/* ABOUT - Mobile Responsive */}
  <section id="about" ref={aboutRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-10 scroll-mt-20">
    <div className="max-w-[1320px] mx-auto">
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-[11px] font-bold tracking-[0.25em] text-red-500 mb-3">WHY REDPULSE?</p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">More Than Just a Platform</h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm leading-6 text-white/40 px-2">
          A centralized system designed to make blood donation, inventory management, and blood requests easier
          to manage.
        </p>
      </div>

      <div id="features" ref={featuresRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 scroll-mt-20">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -6 }}
              className="group rounded-xl border border-white/10 bg-white/[0.025] px-3 sm:px-4 py-4 sm:py-6 text-center hover:border-red-500/40 transition-colors"
            >
              <div className="mx-auto mb-3 sm:mb-5 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-red-500/30 bg-red-500/[0.07] flex items-center justify-center group-hover:bg-red-500/15 transition">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-[10px] sm:text-xs text-white/45 leading-5">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>

  {/* HOW IT WORKS - Mobile Responsive */}
  <section id="how-it-works" ref={howRef} className="relative z-10 py-16 sm:py-24 px-4 sm:px-6 lg:px-10 border-t border-white/[0.05] scroll-mt-20">
    <div className="max-w-[1320px] mx-auto">
      <div className="text-center mb-12 sm:mb-16">
        <p className="text-[11px] font-bold tracking-[0.25em] text-red-500 mb-3">HOW IT WORKS</p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Three Simple Steps to Save a Life</h2>
      </div>

      <div className="relative grid md:grid-cols-3 gap-8 sm:gap-12">
        <div className="hidden md:block absolute top-5 left-[16%] right-[16%] border-t border-dashed border-white/15" />
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              <div className="relative z-10 mx-auto w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-900/40">
                {step.number}
              </div>
              <div className="mt-7 mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/15 bg-white/[0.02] flex items-center justify-center">
                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-red-500" />
              </div>
              <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-[250px] mx-auto text-sm leading-6 text-white/45 px-2">{step.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* DONATION VISUAL - Mobile Responsive */}
      <div className="mt-16 sm:mt-24 grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div className="relative h-[200px] sm:h-[300px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-red-950/30 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.15),transparent_50%)]" />
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [-2, 0, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2"
          >
            <div className="relative w-48 sm:w-72 h-16 sm:h-24 bg-[#d7aa91] rounded-[30px] sm:rounded-[40px] rotate-[-10deg] shadow-2xl">
              <div className="absolute -left-3 sm:-left-4 top-3 sm:top-5 w-12 sm:w-16 h-10 sm:h-14 bg-[#d7aa91] rounded-[25px] sm:rounded-[35px] rotate-[25deg]" />
              <div className="absolute -right-2 top-2 sm:top-3 w-12 sm:w-16 h-9 sm:h-12 bg-[#d7aa91] rounded-[20px] sm:rounded-[30px] rotate-[15deg]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 sm:w-20 h-12 sm:h-16 bg-white rounded-md rotate-[10deg] flex items-center justify-center shadow-lg">
                <Activity className="text-red-500 w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
              </div>
            </div>
          </motion.div>
          <div className="absolute right-6 sm:right-10 bottom-6 sm:bottom-8 w-16 sm:w-24 h-16 sm:h-24 rounded-full bg-red-600/20 blur-2xl" />
        </div>

        <div>
          <p className="text-[11px] tracking-[0.25em] font-bold text-red-500 mb-3">SIMPLE. FAST. MEANINGFUL.</p>
          <h3 className="text-2xl sm:text-3xl font-bold">A Better Way to Manage Blood Donation</h3>
          <p className="mt-4 sm:mt-5 text-white/50 leading-6 sm:leading-7">
            RedPulse brings donors, hospitals, blood requests, and inventory information together in one
            centralized web platform.
          </p>
        </div>
      </div>
    </div>
  </section>
      
{/* IMPACT / DASHBOARD - Mobile Responsive */}
      <section id="impact" ref={impactRef} className="relative z-10 py-16 sm:py-20 px-4 sm:px-6 lg:px-10 scroll-mt-20">
        <div className="max-w-[1320px] mx-auto">
          <div className="grid lg:grid-cols-[0.75fr_1.6fr] gap-8 sm:gap-10 items-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.25em] text-red-500 mb-3">ALL-IN-ONE PLATFORM</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Everything You Need,
                <br />
                All in <span className="text-red-500">One Place</span>
              </h2>
              <p className="mt-4 sm:mt-5 text-sm text-white/45 leading-6 max-w-md">
                RedPulse makes blood donation and management simple, organized, and accessible for donors, hospitals,
                and administrators.
              </p>
              <div className="mt-6 space-y-3">
                {checklist.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/75">
                    <span className="w-5 h-5 rounded-full bg-red-600/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-red-500" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoginError("");
                  setShowLogin(true);
                }}
                className="mt-7 inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl text-sm font-semibold transition"
              >
                Explore Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="relative overflow-hidden">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-white/10 bg-[#080909] shadow-2xl overflow-hidden"
              >
                <div className="h-12 border-b border-white/10 px-3 sm:px-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-red-500" fill="currentColor" />
                    <span className="text-xs font-bold">RedPulse</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 w-40 lg:w-56 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5">
                    <Search className="w-3 h-3 text-white/30" />
                    <span className="text-[9px] text-white/25">Search anything...</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold">RP</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[125px_1fr] min-h-[280px] sm:min-h-[330px]">
                  <div className="border-r border-white/10 p-2 sm:p-3 hidden sm:block">
                    <div className="space-y-1">
                      {[
                        { icon: LayoutDashboard, label: "Dashboard", active: true },
                        { icon: Droplet, label: "Blood Inventory" },
                        { icon: Activity, label: "Blood Requests" },
                        { icon: Users, label: "Donors" },
                        { icon: Heart, label: "Blood Drives" },
                        { icon: BarChart3, label: "Reports" },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className={`flex items-center gap-2 px-2 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[9px] ${
                              item.active ? "bg-red-500/10 text-white" : "text-white/40"
                            }`}
                          >
                            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {item.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      {[
                        { title: "Total Donors", value: "15,892", change: "+12.5%" },
                        { title: "Blood Units", value: "2,450", change: "+8.3%" },
                        { title: "Requests", value: "320", change: "+15.2%" },
                      ].map((card) => (
                        <div
                          key={card.title}
                          className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] p-2 sm:p-3"
                        >
                          <p className="truncate text-[7px] sm:text-[8px] text-white/35">{card.title}</p>
                          <p className="truncate text-[11px] sm:text-base font-bold mt-0.5 sm:mt-1">{card.value}</p>
                          <p className="truncate text-[6px] sm:text-[8px] text-emerald-400 mt-0.5 sm:mt-1">
                            {card.change}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2 sm:p-3">
                        <p className="text-[8px] sm:text-[10px] font-semibold mb-2 sm:mb-4">Blood Inventory Overview</p>
                        <div className="space-y-1 sm:space-y-2">
                          {bloodInventory.map((blood) => (
                            <div key={blood.type} className="flex items-center gap-1 sm:gap-2">
                              <span className="w-5 sm:w-6 text-[7px] sm:text-[8px] text-white/45">{blood.type}</span>
                              <div className="flex-1 h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  whileInView={{ width: `${blood.percentage}%` }}
                                  viewport={{ once: true }}
                                  transition={{ duration: 0.8 }}
                                  className="h-full bg-red-500 rounded-full"
                                />
                              </div>
                              <span className="text-[7px] sm:text-[8px] text-white/40 w-5 sm:w-7 text-right">{blood.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2 sm:p-3">
                        <p className="text-[8px] sm:text-[10px] font-semibold mb-2 sm:mb-4">Recent Requests</p>
                        <div className="space-y-2 sm:space-y-3">
                          {recentRequests.map((request) => (
                            <div key={`${request.hospital}-${request.type}`} className="flex items-center justify-between gap-1 sm:gap-2">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                  <Droplet className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
                                </div>
                                <div>
                                  <p className="text-[7px] sm:text-[8px] font-medium">
                                    {request.type} · {request.units}
                                  </p>
                                  <p className="text-[6px] sm:text-[7px] text-white/30">{request.hospital}</p>
                                </div>
                              </div>
                              <span className="text-[6px] sm:text-[7px] text-white/30">{request.time}</span>
                            </div>
                          ))}
                        </div>
                        <button type="button" className="mt-2 sm:mt-4 text-[7px] sm:text-[8px] text-red-500 font-semibold">
                          View All Requests
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

  {/* CTA - Mobile Responsive */}
  <section id="contact" ref={contactRef} className="relative z-10 px-4 sm:px-6 lg:px-10 py-8 sm:py-10 scroll-mt-20">
    <div className="max-w-[1320px] mx-auto rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/50 via-red-950/20 to-transparent px-5 sm:px-7 lg:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-7">
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden sm:flex w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-red-600 items-center justify-center shadow-lg shadow-red-950/50">
          <Activity className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.5} />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs sm:text-sm text-white/55">Be the reason someone smiles today.</p>
          <h2 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">Be a Hero. Donate Blood.</h2>
        </div>
      </div>
      <div>
        <button
          type="button"
          onClick={handleRegisterClick}
          className="inline-flex items-center gap-2 sm:gap-3 bg-red-600 hover:bg-red-500 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-sm transition"
        >
          Join RedPulse Today
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <p className="text-[10px] sm:text-xs text-white/35 mt-1 sm:mt-2 text-center">Together, we can make a difference. ❤️</p>
      </div>
    </div>
  </section>

  {/* FOOTER - Mobile Responsive */}
  <footer className="relative z-10 border-t border-white/[0.06]">
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
      <div className="col-span-2 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" fill="currentColor" />
          <span className="font-bold text-base sm:text-lg">
            Red<span className="text-red-500">Pulse</span>
          </span>
        </div>
        <p className="text-xs text-white/35 mt-3 max-w-[190px] leading-5">Every drop counts. Every life matters.</p>
        <div className="flex gap-2 mt-5">
          <button type="button" aria-label="Instagram" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-red-500 hover:border-red-500/40 transition">
            <FaInstagram className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button type="button" aria-label="X" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-red-500 hover:border-red-500/40 transition">
            <FaXTwitter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button type="button" aria-label="LinkedIn" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-red-500 hover:border-red-500/40 transition">
            <FaLinkedinIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>

      <FooterColumn title="Platform" links={["About Us", "Features", "How It Works", "Contact"]} />
      <FooterColumn title="For Donors" links={["Find Blood Drives", "Eligibility", "Donation Process", "FAQs"]} />
      <FooterColumn title="For Hospitals" links={["Inventory Management", "Request Blood", "Partner with Us", "Resources"]} />
      <FooterColumn title="Legal" links={["Privacy Policy", "Terms of Service", "Cookie Policy"]} />
    </div>

    <div className="border-t border-white/[0.05] py-5 sm:py-6 text-center text-[10px] sm:text-xs text-white/25 px-4">
      © {new Date().getFullYear()} RedPulse • Blood Donor Registry & Inventory Tracking System
    </div>
  </footer>

  {/* =========================================================
      LOGIN MODAL WITH TURNSTILE - Mobile Responsive
  ========================================================= */}
  <AnimatePresence>
    {showLogin && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-5"
        onClick={() => {
          setShowLogin(false);
          resetLoginTurnstile();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090a0a] shadow-2xl overflow-hidden mx-2 sm:mx-0"
        >
          <div className="p-5 sm:p-7">
            <div className="flex justify-between items-start mb-6 sm:mb-7">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-3 sm:mb-4">
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">Sign In</h2>
                <p className="text-xs sm:text-sm text-white/40 mt-1">Welcome back to RedPulse</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowLogin(false);
                  resetLoginTurnstile();
                }} 
                className="p-2 rounded-lg hover:bg-white/5" 
                aria-label="Close login"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div>
                <label className="text-xs sm:text-sm text-white/65">Email Address</label>
                <div className="relative mt-1 sm:mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="text-xs sm:text-sm text-white/65">Password</label>
                  <button 
                    type="button" 
                    onClick={openForgotPassword}
                    className="text-[10px] sm:text-xs text-red-500 hover:text-red-400 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1 sm:mt-2">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-10 sm:pr-11 text-sm outline-none focus:border-red-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="flex justify-center py-1 sm:py-2 overflow-hidden">
                <div ref={turnstileRef} className="cf-turnstile transform scale-75 sm:scale-100 origin-center" />
              </div>

              {loginError && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 sm:p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>{loginError}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !turnstileToken}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transition"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs sm:text-sm text-white/40 mt-5 sm:mt-6">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  resetLoginTurnstile();
                  handleRegisterClick();
                }}
                className="text-red-500 font-semibold hover:text-red-400 transition"
              >
                Get Started
              </button>
            </p>

            <div className="relative mt-5 sm:mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] sm:text-xs">
                <span className="px-4 bg-[#090a0a] text-white/30">
                  Secured with Cloudflare
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* =========================================================
      FORGOT PASSWORD MODAL - Mobile Responsive
  ========================================================= */}
  <AnimatePresence>
    {showForgotPassword && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-5"
        onClick={closeForgotPassword}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090a0a] shadow-2xl overflow-hidden mx-2 sm:mx-0"
        >
          <div className="p-5 sm:p-7">
            <div className="flex justify-between items-start mb-6 sm:mb-7">
              <div>
                <button
                  type="button"
                  onClick={backToLogin}
                  className="flex items-center gap-2 text-xs sm:text-sm text-white/40 hover:text-white/70 transition mb-3 sm:mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-3 sm:mb-4">
                  {showOtpInput ? <Key className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> : 
                   showResetPassword ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> : 
                   showPasswordResetSent ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> :
                   <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {showOtpInput ? "Verify Code" : 
                   showResetPassword ? "Set New Password" : 
                   showPasswordResetSent ? "Password Reset" : 
                   "Reset Password"}
                </h2>
                <p className="text-xs sm:text-sm text-white/40 mt-1">
                  {showOtpInput ? `Enter the 6-digit code sent to ${forgotEmail}` : 
                   showResetPassword ? "Create a new password for your account" :
                   showPasswordResetSent ? "Your password has been reset successfully!" :
                   "We'll send you a verification code"}
                </p>
              </div>
              <button 
                type="button" 
                onClick={closeForgotPassword} 
                className="p-2 rounded-lg hover:bg-white/5" 
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            {/* Step 1: Send OTP with Turnstile */}
            {!showOtpInput && !showResetPassword && !showPasswordResetSent && (
              <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-xs sm:text-sm text-white/65">Email Address</label>
                  <div className="relative mt-1 sm:mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-3 sm:pr-4 text-sm outline-none focus:border-red-500 transition"
                    />
                  </div>
                </div>

                {/* Cloudflare Turnstile - Only show on first step */}
                <div className="flex justify-center py-1 sm:py-2 overflow-hidden">
                  <div ref={forgotTurnstileRef} className="cf-turnstile transform scale-75 sm:scale-100 origin-center" />
                </div>

                {forgotError && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 sm:p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>{forgotError}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotIsLoading || !forgotTurnstileToken}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transition"
                >
                  {forgotIsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Verify 6-Digit OTP */}
            {showOtpInput && !showResetPassword && !showPasswordResetSent && (
              <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-xs sm:text-sm text-white/65 block text-center mb-3 sm:mb-4">
                    Verification Code
                  </label>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => {
                        const numericValue = value.replace(/\D/g, "");
                        setOtpCode(numericValue.slice(0, 6));
                        setForgotError("");
                      }}
                      inputMode="numeric"
                      autoFocus
                      disabled={forgotIsLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <p className="text-[10px] sm:text-xs text-white/35 mt-2 sm:mt-3 text-center">
                    {otpCode.length}/6 digits entered
                  </p>

                  {otpTimer > 0 ? (
                    <p className="text-[10px] sm:text-xs text-white/40 mt-2 text-center">
                      Code expires in: {formatTime(otpTimer)}
                    </p>
                  ) : (
                    <p className="text-[10px] sm:text-xs text-red-400 mt-2 text-center">
                      Code expired. Please request a new code.
                    </p>
                  )}
                </div>

                {forgotError && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 sm:p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>{forgotError}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotIsLoading || otpCode.length !== 6}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transition"
                >
                  {forgotIsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Continuing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Confirm Code
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={forgotIsLoading || resendDisabled}
                    className="text-xs sm:text-sm text-red-500 hover:text-red-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendDisabled
                      ? `Resend in ${formatTime(otpTimer)}`
                      : "Didn't receive code? Resend"}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-xs sm:text-sm text-white/40 hover:text-white/60 transition"
                  >
                    ← Back to email
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password */}
            {!showOtpInput && showResetPassword && !showPasswordResetSent && (
              <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="text-xs sm:text-sm text-white/65">New Password</label>
                  <div className="relative mt-1 sm:mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password (min 6 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-10 sm:pr-11 text-sm outline-none focus:border-red-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-white/65">Confirm Password</label>
                  <div className="relative mt-1 sm:mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 sm:py-3 pl-9 sm:pl-10 pr-10 sm:pr-11 text-sm outline-none focus:border-red-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 sm:p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>{forgotError}</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotIsLoading}
                  className="w-full py-2.5 sm:py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transition"
                >
                  {forgotIsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-xs sm:text-sm text-white/40 hover:text-white/60 transition"
                  >
                    ← Back
                  </button>
                </div>
              </form>
            )}

            {/* Success Message */}
            {showPasswordResetSent && (
              <div className="text-center py-3 sm:py-4">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Password Reset Successful!</h3>
                <p className="text-xs sm:text-sm text-white/40">
                  Your password has been reset successfully.
                </p>
                <p className="text-[10px] sm:text-xs text-white/30 mt-2">
                  Redirecting to login...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* REGISTER TYPE SELECTOR MODAL - Mobile Responsive */}
  <AnimatePresence>
    {showRegister && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-5"
        onClick={() => setShowRegister(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#090a0a] shadow-2xl mx-2 sm:mx-0"
        >
          <div className="p-5 sm:p-7">
            <div className="flex justify-between mb-5 sm:mb-7">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Get Started</h2>
                <p className="text-xs sm:text-sm text-white/40 mt-1">Choose your account type</p>
              </div>
              <button type="button" onClick={() => setShowRegister(false)} className="p-2" aria-label="Close registration">
                <X className="w-5 h-5 text-white/50" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSelectDonor}
                className="w-full p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.04] transition text-left flex items-center gap-3 sm:gap-4 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold">Register as Donor</h3>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">Donate blood and help save lives.</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-red-500 group-hover:translate-x-1 transition flex-shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleSelectHospital}
                className="w-full p-4 sm:p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-red-500/40 hover:bg-red-500/[0.04] transition text-left flex items-center gap-3 sm:gap-4 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold">Register as Hospital</h3>
                  <p className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">Manage blood inventory and requests.</p>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/20 group-hover:text-red-500 group-hover:translate-x-1 transition flex-shrink-0" />
              </button>
            </div>

            <p className="text-center text-xs sm:text-sm text-white/40 mt-5 sm:mt-6">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setShowRegister(false);
                  setLoginError("");
                  setShowLogin(true);
                }}
                className="text-red-500 font-semibold hover:text-red-400 transition"
              >
                Sign In
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* DONOR REGISTER MODAL */}
  <DonorRegisterModal
    isOpen={showDonorRegister}
    onClose={() => setShowDonorRegister(false)}
  />

  {/* HOSPITAL REGISTER MODAL */}
  <HospitalRegisterModal
    isOpen={showHospitalRegister}
    onClose={() => setShowHospitalRegister(false)}
  />
</main>

);
}

/* =========================================================
FOOTER COLUMN
========================================================= */

function FooterColumn({ title, links }: { title: string; links: string[] }) {
return (
<div>
<h3 className="text-xs sm:text-sm font-semibold text-white mb-3 sm:mb-4">{title}</h3>
<ul className="space-y-2 sm:space-y-3">
{links.map((link) => (
<li key={link}>
<button type="button" className="text-[10px] sm:text-xs text-white/40 hover:text-white transition">
{link}
</button>
</li>
))}
</ul>
</div>
);
}