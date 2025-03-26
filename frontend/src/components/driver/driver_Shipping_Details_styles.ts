import { makeStyles } from "@mui/styles";
import { Theme } from "@mui/material/styles";

const useStyles = makeStyles((theme: Theme) => ({
  leftStack: {
    spacing: 2,
    width: "25%",
    mr: 1,
    p: "20px",
    height: "100%",
  },
  chip: {
    minWidth: "100px",
    height: "32px",
    margin: theme.spacing(0.25),
    fontSize: "14px",
    fontWeight: "bold",
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    borderRadius: "16px",
  },
  notifyButton: {
    padding: theme.spacing(2, 3),
    borderRadius: 2,
    width: "14vw",
    height: "6vh",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out",
    // boxShadow: `0px 0px 15px ${theme.palette.primary.light}`, // Subtle glow effect
    "&:hover": {
      boxShadow: `0px 0px 25px ${theme.palette.primary.main}`, // Stronger glow
      transform: "scale(1.05)",
    },
    // "&:focus": {
    //   boxShadow: `0px 0px 30px ${theme.palette.primary.dark}`, // Extra glow when focused
    //   outline: "none",
    // },
  },
  messageBox: {
    height: "25vh",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[300],
    border: "1px solid",
    borderColor: theme.palette.grey[300],
    borderRadius: theme.shape.borderRadius,
  },
}));

export default useStyles;
