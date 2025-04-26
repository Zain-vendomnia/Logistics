import { makeStyles } from "@mui/styles";
import { alpha, Theme } from "@mui/material";

const useStyles = makeStyles((theme: Theme) => ({
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
