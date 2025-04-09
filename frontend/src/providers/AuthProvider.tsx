import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import IUser from "../types/user.type";
import EventBus from "../common/EventBus";
import * as AuthService from "../services/auth.service";
import { isSuperAdmin, isAdmin, isDriver } from "../types/user.type";

type AuthContextType = {
  user: IUser | null;
  login: (userData: IUser) => void;
  logout: () => void;
  showDriverBoard: boolean;
  showAdminBoard: boolean;
  showSuperAdminBoard: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [showDriverBoard, setShowDriverBoard] = useState<boolean>(false);
  const [showAdminBoard, setShowAdminBoard] = useState<boolean>(false);
  const [showSuperAdminBoard, setShowSuperAdminBoard] =
    useState<boolean>(false);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    console.log("userdetails: " + JSON.stringify(user));
    if (user) {
      setCurrentUser(user);
      setShowDriverBoard(isDriver(user));
      setShowAdminBoard(isAdmin(user));
      setShowSuperAdminBoard(isSuperAdmin(user));
    }

    EventBus.on("logout", logout);

    return () => {
      EventBus.remove("logout", logout);
      // AuthContext.Provider = null; // Context clean up to avoid memory leaks
      setCurrentUser(null);
    };
  }, []);

  const login = (userData: IUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setCurrentUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setCurrentUser(null);
    AuthService.logout();
    setShowDriverBoard(false);
    setShowAdminBoard(false);
    setShowSuperAdminBoard(false);
  };

  const value: AuthContextType = {
    user: currentUser,
    login,
    logout,
    showDriverBoard,
    showAdminBoard,
    showSuperAdminBoard,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
