// app/auth/forgot-password/page.tsx
"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

/* =========================================================
   TYPES
========================================================= */

type Step =
  | "email"
  | "otp"
  | "password"
  | "success";

type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
};

type TurnstileAPI = {
  render: (
    element: HTMLElement,
    options: TurnstileOptions
  ) => string;

  reset: (widgetId?: string) => void;

  remove: (widgetId?: string) => void;
};

/*
  IMPORTANT:
  We DO NOT use declare global / interface Window here.

  Your app/page.tsx already declares window.turnstile.
  Declaring it again in this file caused TS2717.
*/
const getTurnstile = (): TurnstileAPI | undefined => {
  if (
    typeof window === "undefined"
  ) {
    return undefined;
  }

  return (
    window as Window & {
      turnstile?: TurnstileAPI;
    }
  ).turnstile;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ForgotPasswordPage() {
  const router = useRouter();

  /* =======================================================
     STEP
  ======================================================= */

  const [step, setStep] =
    useState<Step>("email");

  /* =======================================================
     EMAIL
  ======================================================= */

  const [email, setEmail] =
    useState("");

  /* =======================================================
     OTP
  ======================================================= */

  const [otp, setOtp] =
    useState("");

  const [otpTimer, setOtpTimer] =
    useState(60);

  const [resendDisabled, setResendDisabled] =
    useState(true);

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     TURNSTILE
  ======================================================= */

  const turnstileRef =
    useRef<HTMLDivElement>(null);

  const [turnstileToken, setTurnstileToken] =
    useState("");

  const [turnstileWidgetId, setTurnstileWidgetId] =
    useState("");

  const [turnstileLoaded, setTurnstileLoaded] =
    useState(false);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (step !== "otp") {
      return;
    }

    if (otpTimer <= 0) {
      setResendDisabled(false);
      return;
    }

    const interval = setInterval(() => {
      setOtpTimer((previous) => {
        if (previous <= 1) {
          setResendDisabled(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [step, otpTimer]);

  /* =======================================================
     TURNSTILE INITIALIZATION
  ======================================================= */

  useEffect(() => {
    if (
      !turnstileLoaded ||
      step !== "email" ||
      !turnstileRef.current ||
      turnstileWidgetId
    ) {
      return;
    }

    const turnstile = getTurnstile();

    if (!turnstile) {
      return;
    }

    const siteKey =
      process.env
        .NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      console.warn(
        "NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing."
      );

      return;
    }

    try {
      const widgetId =
        turnstile.render(
          turnstileRef.current,
          {
            sitekey: siteKey,

            theme: "dark",

            callback: (
              token: string
            ) => {
              setTurnstileToken(token);
              setError("");
            },

            "expired-callback": () => {
              setTurnstileToken("");
            },

            "error-callback": () => {
              setTurnstileToken("");

              setError(
                "Security verification failed. Please try again."
              );
            },
          }
        );

      setTurnstileWidgetId(
        widgetId
      );
    } catch (turnstileError) {
      console.error(
        "Turnstile initialization error:",
        turnstileError
      );
    }
  }, [
    turnstileLoaded,
    step,
    turnstileWidgetId,
  ]);

  /* =======================================================
     CLEANUP TURNSTILE
  ======================================================= */

  const resetTurnstile = () => {
    const turnstile =
      getTurnstile();

    if (
      turnstile &&
      turnstileWidgetId
    ) {
      try {
        turnstile.reset(
          turnstileWidgetId
        );
      } catch (error) {
        console.error(
          "Turnstile reset error:",
          error
        );
      }
    }

    setTurnstileToken("");
  };

  const removeTurnstile = () => {
    const turnstile =
      getTurnstile();

    if (
      turnstile &&
      turnstileWidgetId
    ) {
      try {
        turnstile.remove(
          turnstileWidgetId
        );
      } catch (error) {
        console.error(
          "Turnstile remove error:",
          error
        );
      }
    }

    setTurnstileWidgetId("");
    setTurnstileToken("");
  };

  /* =======================================================
     CLEAR ERROR
  ======================================================= */

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  /* =======================================================
     STEP 1
     SEND OTP
     
     API:
     POST /api/auth/forgot-password
  ======================================================= */

  const handleSendOTP = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    clearMessages();

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    if (!turnstileToken) {
      setError(
        "Please complete the security verification."
      );

      return;
    }

    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email: cleanEmail,
              turnstileToken,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.error ||
            "Failed to send verification code."
        );

        resetTurnstile();

        return;
      }

      /*
        Backend has now generated and emailed
        the 6-digit OTP.
      */

      setEmail(cleanEmail);

      setOtp("");

      setOtpTimer(60);

      setResendDisabled(true);

      setStep("otp");

      removeTurnstile();
    } catch (requestError) {
      console.error(
        "Send OTP error:",
        requestError
      );

      setError(
        "Unable to send the verification code. Please try again."
      );

      resetTurnstile();
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     STEP 2
     
     IMPORTANT:
     There is NO /api/auth/verify-otp anymore.

     Your API verifies the OTP when:
     POST /api/auth/reset-password

     Therefore this step only checks that the user
     entered exactly 6 digits, then moves to password.
  ======================================================= */

  const handleVerifyOTP = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    clearMessages();

    if (otp.length !== 6) {
      setError(
        "Please enter the complete 6-digit code."
      );

      return;
    }

    if (!email) {
      setError(
        "Email is missing. Please start again."
      );

      return;
    }

    /*
      DO NOT clear otp here.

      reset-password needs:
        email
        otp
        newPassword
    */

    setStep("password");
  };

  /* =======================================================
     STEP 2B
     RESEND OTP

     API:
     POST /api/auth/forgot-password
  ======================================================= */

  const handleResendOTP = async () => {
    if (
      resendDisabled ||
      isLoading
    ) {
      return;
    }

    clearMessages();

    if (!email) {
      setError(
        "Email is missing. Please start again."
      );

      return;
    }

    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/forgot-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.error ||
            "Failed to resend verification code."
        );

        return;
      }

      setOtp("");

      setOtpTimer(60);

      setResendDisabled(true);

      setSuccess(
        "A new 6-digit verification code has been sent."
      );
    } catch (requestError) {
      console.error(
        "Resend OTP error:",
        requestError
      );

      setError(
        "Unable to resend the verification code."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     STEP 3
     RESET PASSWORD

     API:
     POST /api/auth/reset-password
  ======================================================= */

  const handleResetPassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    clearMessages();

    if (otp.length !== 6) {
      setError(
        "Your verification code must contain 6 digits."
      );

      setStep("otp");

      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (!email) {
      setError(
        "Email is missing. Please start again."
      );

      return;
    }

    setIsLoading(true);

    try {
      const response =
        await fetch(
          "/api/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email:
                email
                  .trim()
                  .toLowerCase(),

              otp,

              newPassword,
            }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        setError(
          data.error ||
            "Failed to reset your password."
        );

        return;
      }

      setSuccess(
        "Your password has been reset successfully."
      );

      setStep("success");

      setNewPassword("");

      setConfirmPassword("");
    } catch (requestError) {
      console.error(
        "Reset password error:",
        requestError
      );

      setError(
        "Unable to reset your password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     GO BACK TO EMAIL
  ======================================================= */

  const handleBackToEmail = () => {
    clearMessages();

    setStep("email");

    setOtp("");

    setOtpTimer(0);

    setResendDisabled(false);

    setNewPassword("");

    setConfirmPassword("");
  };

  /* =======================================================
     GO BACK TO OTP
  ======================================================= */

  const handleBackToOTP = () => {
    clearMessages();

    setStep("otp");
  };

  /* =======================================================
     RESET EVERYTHING
  ======================================================= */

  const handleStartOver = () => {
    clearMessages();

    setStep("email");

    setEmail("");

    setOtp("");

    setNewPassword("");

    setConfirmPassword("");

    setOtpTimer(0);

    setResendDisabled(false);
  };

  /* =======================================================
     TIMER
  ======================================================= */

  const formatTime = (
    seconds: number
  ) => {
    return `${seconds}s`;
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =====================================================
          CLOUDFLARE TURNSTILE
      ===================================================== */}

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => {
          setTurnstileLoaded(true);
        }}
      />

      <main className="min-h-screen bg-[#020303] text-white flex items-center justify-center px-4 py-10">
        {/* ===================================================
            BACKGROUND
        =================================================== */}

        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-red-900/10 blur-[140px]" />

          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-red-950/10 blur-[140px]" />
        </div>

        {/* ===================================================
            CARD
        =================================================== */}

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-3xl border border-white/10 bg-[#090a0a]/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* =================================================
                HEADER
            ================================================= */}

            <div className="p-7 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition mb-6"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>

                  <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-5">
                    {step ===
                    "otp" ? (
                      <KeyRound className="w-6 h-6 text-red-500" />
                    ) : step ===
                      "password" ? (
                      <Lock className="w-6 h-6 text-red-500" />
                    ) : step ===
                      "success" ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Mail className="w-6 h-6 text-red-500" />
                    )}
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight">
                    {step ===
                    "email"
                      ? "Reset Password"
                      : step ===
                        "otp"
                      ? "Verify Code"
                      : step ===
                        "password"
                      ? "Set New Password"
                      : "Password Reset"}
                  </h1>

                  <p className="text-sm text-white/40 mt-1 leading-5">
                    {step ===
                    "email"
                      ? "We'll send you a verification code"
                      : step ===
                        "otp"
                      ? `Enter the 6-digit code sent to ${email}`
                      : step ===
                        "password"
                      ? "Create a new password for your account"
                      : "Your password has been reset successfully"}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="px-7 pb-7">
              {/* =================================================
                  ERROR
              ================================================= */}

              {error && (
                <div className="flex items-start gap-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mb-5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />

                  <p className="leading-5">
                    {error}
                  </p>
                </div>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {success &&
                step !==
                  "success" && (
                  <div className="flex items-start gap-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 p-3.5 rounded-xl mb-5">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />

                    <p className="leading-5">
                      {success}
                    </p>
                  </div>
                )}

              {/* =================================================
                  STEP 1
                  EMAIL
              ================================================= */}

              {step ===
                "email" && (
                <form
                  onSubmit={
                    handleSendOTP
                  }
                  className="space-y-5"
                >
                  <div>
                    <label className="text-sm text-white/65">
                      Email Address
                    </label>

                    <div className="relative mt-2">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(
                          event
                        ) => {
                          setEmail(
                            event.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition"
                      />
                    </div>
                  </div>

                  {/* =================================================
                      TURNSTILE
                  ================================================= */}

                  <div className="flex justify-center py-2 min-h-[65px]">
                    <div
                      ref={
                        turnstileRef
                      }
                      className="cf-turnstile"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !turnstileToken ||
                      !email.trim()
                    }
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/30"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Send Verification Code
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-white/30 leading-5">
                    A 6-digit verification
                    code will be sent to
                    your email address.
                  </p>
                </form>
              )}

              {/* =================================================
                  STEP 2
                  SIX-DIGIT OTP
              ================================================= */}

              {step ===
                "otp" && (
                <form
                  onSubmit={
                    handleVerifyOTP
                  }
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm text-white/65 text-center mb-4">
                      Verification Code
                    </label>

                    {/* =================================================
                        SHADCN INPUT OTP
                        EXACTLY 6 SLOTS
                    ================================================= */}

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(
                          value
                        ) => {
                          const numericValue =
                            value.replace(
                              /\D/g,
                              ""
                            );

                          setOtp(
                            numericValue.slice(
                              0,
                              6
                            )
                          );

                          setError("");
                          setSuccess("");
                        }}
                        inputMode="numeric"
                        autoFocus
                        disabled={
                          isLoading
                        }
                      >
                        <InputOTPGroup className="gap-2">
                          <InputOTPSlot
                            index={0}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />

                          <InputOTPSlot
                            index={1}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />

                          <InputOTPSlot
                            index={2}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />

                          <InputOTPSlot
                            index={3}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />

                          <InputOTPSlot
                            index={4}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />

                          <InputOTPSlot
                            index={5}
                            className="w-11 h-12 sm:w-12 sm:h-13 rounded-xl border-white/15 bg-white/[0.04] text-lg"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <p className="text-xs text-white/30 text-center mt-3">
                      {otp.length}/6
                      digits entered
                    </p>

                    {/* =================================================
                        TIMER
                    ================================================= */}

                    {otpTimer >
                      0 && (
                      <p className="text-xs text-white/40 text-center mt-2">
                        Code expires
                        in:{" "}
                        <span className="text-white/70 font-medium">
                          {formatTime(
                            otpTimer
                          )}
                        </span>
                      </p>
                    )}

                    {otpTimer ===
                      0 && (
                      <p className="text-xs text-red-400 text-center mt-2">
                        Code expired.
                        Request a
                        new code.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      otp.length !==
                        6
                    }
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/30"
                  >
                    {isLoading ? (
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

                  {/* =================================================
                      RESEND
                  ================================================= */}

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={
                        handleResendOTP
                      }
                      disabled={
                        resendDisabled ||
                        isLoading
                      }
                      className="text-sm text-red-500 hover:text-red-400 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendDisabled
                        ? `Resend in ${formatTime(
                            otpTimer
                          )}`
                        : "Didn't receive code? Resend"}
                    </button>
                  </div>

                  {/* =================================================
                      BACK
                  ================================================= */}

                  <button
                    type="button"
                    onClick={
                      handleBackToEmail
                    }
                    className="w-full text-sm text-white/40 hover:text-white/70 transition"
                  >
                    ← Back to email
                  </button>
                </form>
              )}

              {/* =================================================
                  STEP 3
                  NEW PASSWORD
              ================================================= */}

              {step ===
                "password" && (
                <form
                  onSubmit={
                    handleResetPassword
                  }
                  className="space-y-5"
                >
                  {/* =================================================
                      NEW PASSWORD
                  ================================================= */}

                  <div>
                    <label className="text-sm text-white/65">
                      New Password
                    </label>

                    <div className="relative mt-2">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        required
                        minLength={6}
                        value={
                          newPassword
                        }
                        onChange={(
                          event
                        ) => {
                          setNewPassword(
                            event.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-10 pr-11 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              previous
                            ) =>
                              !previous
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-white/30 hover:text-white/60" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/30 hover:text-white/60" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-white/30 mt-2">
                      Minimum 6
                      characters.
                    </p>
                  </div>

                  {/* =================================================
                      CONFIRM PASSWORD
                  ================================================= */}

                  <div>
                    <label className="text-sm text-white/65">
                      Confirm Password
                    </label>

                    <div className="relative mt-2">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        required
                        minLength={6}
                        value={
                          confirmPassword
                        }
                        onChange={(
                          event
                        ) => {
                          setConfirmPassword(
                            event.target
                              .value
                          );

                          setError("");
                        }}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 pl-10 pr-11 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 transition"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (
                              previous
                            ) =>
                              !previous
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-white/30 hover:text-white/60" />
                        ) : (
                          <Eye className="w-4 h-4 text-white/30 hover:text-white/60" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      PASSWORD MATCH INDICATOR
                  ================================================= */}

                  {confirmPassword.length >
                    0 && (
                    <div
                      className={`text-xs ${
                        newPassword ===
                        confirmPassword
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {newPassword ===
                      confirmPassword
                        ? "✓ Passwords match"
                        : "Passwords do not match"}
                    </div>
                  )}

                  {/* =================================================
                      RESET
                  ================================================= */}

                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      newPassword.length <
                        6 ||
                      confirmPassword.length <
                        6 ||
                      newPassword !==
                        confirmPassword
                    }
                    className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-red-950/30"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleBackToOTP
                    }
                    className="w-full text-sm text-white/40 hover:text-white/70 transition"
                  >
                    ← Back to verification code
                  </button>
                </form>
              )}

              {/* =================================================
                  SUCCESS
              ================================================= */}

              {step ===
                "success" && (
                <div className="text-center py-5">
                  <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>

                  <h2 className="text-xl font-bold">
                    Password Reset
                    Successful
                  </h2>

                  <p className="text-sm text-white/40 leading-6 mt-3">
                    Your password has
                    been changed
                    successfully. You
                    can now log in
                    using your new
                    password.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/"
                      )
                    }
                    className="w-full mt-7 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 font-semibold transition"
                  >
                    Back to Login
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleStartOver
                    }
                    className="w-full mt-3 py-3 text-sm text-white/40 hover:text-white/70 transition"
                  >
                    Reset another
                    account
                  </button>
                </div>
              )}
            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="border-t border-white/[0.06] px-7 py-5 text-center">
              <p className="text-[11px] text-white/25">
                RedPulse • Blood Donor
                Registry & Inventory
                Tracking System
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}