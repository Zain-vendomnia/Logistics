import { useState, useEffect } from "react";
import { useAnimation } from "framer-motion";
import { SxProps } from "@mui/material";

export const useHeadingUnderline = () => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const controls = useAnimation();

  const handleFocusIn = () => setIsInputFocused(true);
  const handleFocusOut = () => setIsInputFocused(false);

  useEffect(() => {
    controls.start({
      y: isInputFocused ? -10 : 0,
      transition: { type: "spring", stiffness: 200, damping: 15 },
    });
  }, [isInputFocused, controls]);

  const headingSx: SxProps = {
    position: "relative",
    display: "inline-block",
  };

  return {
    controls,
    handleFocusIn,
    handleFocusOut,
    isInputFocused,
    headingSx,
  };
};
