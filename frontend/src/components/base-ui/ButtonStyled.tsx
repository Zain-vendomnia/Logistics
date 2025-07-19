import { styled } from "@mui/styles";
import Button, { ButtonProps } from "@mui/material/Button";

const ButtonStyled = styled(Button)<ButtonProps>(({ theme }) => ({
  borderRadius: "12px",
  textTransform: "none",
  padding: 2,
  boxShadow: "none",
  transition: "background-color 0.3s, transform 0.2s ease-in-out",
  "&:hover": {
    boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
    transform: "scale(1.02)",
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

export default ButtonStyled;
