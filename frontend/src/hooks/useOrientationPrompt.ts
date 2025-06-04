import { useEffect, useState } from "react";

export const useOrientationPrompt = () => {
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isRotated, setIsRotated] = useState(false);

  const checkOrientation = () => {
    const height = window.innerHeight;
    const width = window.innerWidth;
    const isPortrait = height > width;
    const isSmallScreen = Math.min(width, height) < 1200;

    const showPrompt = isPortrait && isSmallScreen;
    setIsPromptVisible(showPrompt);
    setIsRotated(showPrompt);
  };

  useEffect(() => {
    // console.log("Check Orientation Called");
    checkOrientation();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  return { isPromptVisible, isRotated };
};
