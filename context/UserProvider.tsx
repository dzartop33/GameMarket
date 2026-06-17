"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

type UserData = {
  id: string;
  email: string;
  username: string;
  role: string;
  balance: number;
};

type UserContextType = {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<UserData | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function refreshUser() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const authUser = session.user;

      const [profileResult, balanceResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, role")
            .eq("id", authUser.id),

          supabase
            .from("balances")
            .select("balance")
            .eq("id", authUser.id),
        ]);

      const profile =
        profileResult.data?.[0];

      const balance =
        balanceResult.data?.[0];

      setUser({
        id: authUser.id,
        email:
          authUser.email || "",
        username:
          profile?.username ||
          authUser.email?.split("@")[0] ||
          "user",
        role:
          profile?.role || "user",
        balance: Number(
          balance?.balance || 0
        ),
      });

      setLoading(false);
    } catch (error) {
      console.error(
        "UserProvider error:",
        error
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshUser();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          refreshUser();
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(
    UserContext
  );
}