import React, { createContext, useContext, useState, useEffect } from "react";

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  staff_id: string;
  role: string;
  department_id: string;
}

interface AuthContextType {
  user: User | null;
  department: Department | null;
  setDepartment: (dept: Department | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [department, setDepartmentState] = useState<Department | null>(null);
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    const savedDept = localStorage.getItem("department");
    const savedUser = localStorage.getItem("user");

    if (savedDept) setDepartmentState(JSON.parse(savedDept));
    if (savedUser) setUserState(JSON.parse(savedUser));
  }, []);

  const setDepartment = (dept: Department | null) => {
    setDepartmentState(dept);

    if (dept) localStorage.setItem("department", JSON.stringify(dept));
    else localStorage.removeItem("department");
  };

  const setUser = (user: User | null) => {
    setUserState(user);

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  };

  const logout = () => {
    setUser(null);
    setDepartment(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        department,
        setDepartment,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};