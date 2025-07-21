import { useState } from "react";
import { useLocation } from "react-router-dom";

const ACTIVE_PATH_KEY = "active_path";
const SIDEBAR_EXPAND_KEY = "sb_e";

export const useLayoutNavigator = () => {
  const location = useLocation();
  const hideSidebar = ["/login"].includes(location.pathname.toLowerCase());

  const [activePath, setActivePath] = useState(() => {
    return sessionStorage.getItem(ACTIVE_PATH_KEY) || location.pathname;
  });

  const updateActivePath = (path: string) => {
    sessionStorage.setItem(ACTIVE_PATH_KEY, path);
    setActivePath(path);
  };

  const [isOpen, setIsOpen] = useState(() => {
    const stored = sessionStorage.getItem(SIDEBAR_EXPAND_KEY);
    return stored === null ? true : stored === "true";
  });
  const toggleSidebar = () => {
    sessionStorage.setItem(SIDEBAR_EXPAND_KEY, String(!isOpen));
    setIsOpen((prev) => !prev);
  };

  const clearSessionStack = () => {
    sessionStorage.removeItem(ACTIVE_PATH_KEY);
    sessionStorage.removeItem(SIDEBAR_EXPAND_KEY);
  };

  return {
    activePath,
    hideSidebar,
    updateActivePath,
    isOpen,
    toggleSidebar,
    clearSessionStack,
  };
};
