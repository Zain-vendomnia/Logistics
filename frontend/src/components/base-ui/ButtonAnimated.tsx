import { styled } from "@mui/material/styles";
import { Button, ButtonProps } from "@mui/material";
import { motion } from "framer-motion";

const StyledButton = styled(Button)<ButtonProps>(({ theme }) => ({
  borderRadius: "12px",
  textTransform: "none",
  padding: theme.spacing(1.5, 3),
  boxShadow: "none",
}));

const ButtonAnimated = (props: ButtonProps) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    transition={{ type: "spring", stiffness: 300 }}
    style={{ display: "inline-block" }}
  >
    <StyledButton {...props} />
  </motion.div>
);

export default ButtonAnimated;
