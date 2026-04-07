import supabase from "@/lib/supabase";

const getCookieBase = (maxAgeSeconds) => {
  const parts = [`max-age=${maxAgeSeconds}`, "path=/", "samesite=lax"];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("secure");
  }
  return parts.join("; ");
};

const setCookie = (name, value, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  if (typeof document === "undefined") return;
  const encodedValue = encodeURIComponent(value || "");
  document.cookie = `${name}=${encodedValue}; ${getCookieBase(maxAgeSeconds)}`;
};

const clearCookie = (name) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; max-age=0; path=/; samesite=lax`;
};

const saveAccessToken = (session) => {
  if (typeof window === "undefined") return;
  if (session?.access_token) {
    localStorage.setItem("token", session.access_token);
    setCookie("ll_token", session.access_token);
  }
};

const saveRoleCookie = (role) => {
  if (!role) {
    clearCookie("ll_role");
    return;
  }
  setCookie("ll_role", role);
};

export const authService = {
  signUpWithPassword: async ({
    email,
    password,
    name,
    role,
    emailRedirectTo,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role,
        },
        emailRedirectTo,
      },
    });

    if (error) throw error;

    saveAccessToken(data.session);
    return data;
  },

  sendOtpLogin: async ({ email, emailRedirectTo }) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo,
      },
    });

    if (error) throw error;
  },

  resendSignupOtp: async ({ email, emailRedirectTo }) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) throw error;
  },

  verifyOtp: async ({ email, token, type = "email" }) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (error) throw error;

    saveAccessToken(data.session);
    return data;
  },

  loginWithPassword: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    saveAccessToken(data.session);
    return data.session;
  },

  signInWithGoogle: async ({ redirectTo }) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) throw error;
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    saveAccessToken(data.session);
    return data.session;
  },

  getProfile: async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("users")
      .select("id_user, nama, email, role, auth_user_id")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();

    if (error) throw error;
    saveRoleCookie(data?.role);
    return data;
  },

  updateRole: async (role) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) throw new Error("Not authenticated");

    const displayName =
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.name ||
      (userData.user.email ? userData.user.email.split("@")[0] : null) ||
      "User";

    const payload = {
      auth_user_id: userData.user.id,
      email: userData.user.email,
      nama: displayName,
      role,
    };

    const { data, error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "auth_user_id" })
      .select("role")
      .maybeSingle();

    if (error) throw error;
    saveRoleCookie(role);
    return data;
  },

  logout: async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      clearCookie("ll_token");
      clearCookie("ll_role");
      window.location.href = "/auth/login";
    }
  },
};
