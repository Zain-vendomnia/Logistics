import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AttentionBoxProps {
  active?: boolean; // animation on or off
  children: ReactNode;
  borderRadius?: number | string;
  padding?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export const AttentionBox = ({
  active = true,
  children,
  borderRadius = 12,
  padding,
  style,
  className,
}: AttentionBoxProps) => {
  return (
    <motion.div
      animate={
        active
          ? {
              borderColor: ["#ff9800", "#ff5722", "#ff9800"],
              boxShadow: [
                "0 0 0px #ff9800",
                "0 0 12px #ff5722",
                "0 0 0px #ff9800",
              ],
            }
          : {
              // borderColor: "#ccc",
              border: '0px ',
              boxShadow: "none",
            }
      }
      transition={{
        duration: 1.5,
        repeat: active ? Infinity : 0,
      }}
      style={{
        border: "3px solid",
        borderRadius,
        display: "inline-block",
        padding,
        ...style,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
