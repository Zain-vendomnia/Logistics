import { makeStyles } from "@mui/styles";
import { alpha, Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
  leftStack: {
    spacing: 2,
    width: "25%",
    mr: 1,
    p: "10px",
    height: "100%",
  },

  notifyButton: {
    position: "relative",
    padding: "6px 12px",
    borderRadius: 8,
    width: "15vw",
    minWidth: 180,
    maxWidth: 240,
    height: "9vh",
    fontSize: "1.05rem",
    fontStyle: "bold",
  },
}));

export default useStyles;
