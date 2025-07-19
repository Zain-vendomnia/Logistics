import { motion } from "framer-motion";
import theme from "../../theme";

const underlineStyle = {
  height: "3px",
  backgroundColor: theme.palette.primary.dark,
  width: "80%",
  bottom: -4,
  margin: "0 auto",
};

export const UnderlineElement = ({
  isInputFocused,
}: {
  isInputFocused?: boolean;
}) => {
  return (
    <motion.div
      // layoutId = "underline"
      // id = "underline"
      style={underlineStyle}
      initial={{ opacity: 0, y: 10 }}
      animate={isInputFocused ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    />
  );
};
