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
  messageBox: {
    height: "25vh",
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[300],
    border: "1px solid",
    borderColor: theme.palette.grey[400],
    borderRadius: theme.shape.borderRadius,
  },
  iconBlinks: {
    position: "relative",
    overflow: "hidden",
    "&:before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: alpha(theme.palette.primary.dark, 0.5),
      borderRadius: "50%",
    },
  },
}));

export default useStyles;
