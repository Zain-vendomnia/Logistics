import { makeStyles } from "@mui/styles";
import { alpha, Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
  chip: {
    minWidth: "100px",
    height: "38px",
    margin: theme.spacing(0.5),
    fontSize: "18px",
    fontWeight: "bold",
    color: theme.palette.primary.dark,
    borderColor: theme.palette.primary.dark,
    borderRadius: "16px",
  },
  messageBox_bg: {
    height: "auto",
    // height: "25vh",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[300],
    border: "1px solid",
    borderColor: theme.palette.grey[400],
    borderRadius: theme.shape.borderRadius,
    paddingBottom: "20px",
  },
  messageBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 1,
    marginBottom: "6px",
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
