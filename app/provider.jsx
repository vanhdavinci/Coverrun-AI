"use client"
import { UserDetailContext } from "@/context/UserDetailContext";
import { DataRefreshProvider } from "@/context/DataRefreshContext";
import { supabase } from "@/services/supabaseClient";
import { initializeUserJars } from "@/services/accumulativeFinancialService";
import React, { useContext, useEffect, useState } from "react";

function Provider({ children }) {
  const [user, setUser] = useState()

  useEffect(() => {
    // Check if user is authenticated first
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {  // Only proceed if there is an authenticated user
        CreateNewUser(user);
      }
    });
  }, []);

  const CreateNewUser = async (authUser) => {
    try {
      // Check if user already exists in the new users table
      let { data: existingUsers, error: selectError } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email);

      if (selectError) {
        console.error("Error checking existing user:", selectError);
        return;
      }

      console.log("Existing users:", existingUsers);
      
      if (existingUsers?.length == 0) {
        // Create new user in users table
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              full_name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
              email: authUser.email,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user:", insertError);
          return;
        }

        console.log("New user created:", newUser);
        
        // Automatically initialize jars for new users
        try {
          await initializeUserJars(newUser.id);
          console.log("Jars initialized for new user");
        } catch (error) {
          console.error("Error initializing jars for new user:", error);
        }
        
        setUser(newUser);
        return;
      }

      setUser(existingUsers[0]);
    } catch (error) {
      console.error("Error in CreateNewUser:", error);
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    if (!user?.email) return;
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) {
        console.error("Error refreshing user:", error);
        return;
      }

      setUser(data);
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <UserDetailContext.Provider value={{ user, setUser, refreshUser }}>
      <DataRefreshProvider>
      <div>{children}</div>
      </DataRefreshProvider>
    </UserDetailContext.Provider>
  );
}

export default Provider;

export const useUser = () => {
  const context = useContext(UserDetailContext);
  return context
}