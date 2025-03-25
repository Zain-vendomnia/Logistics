// import { makeStyles } from "@mui/styles";

// const useStyles = makeStyles({
//   leftStack: {
//     flexDirection: "row",
//     spacing: 1,
//     width: "25%",
//     maxWidth: "302px",
//     mr: 1,
//     pb: "20px",
//     height: "100%",
//     position: "relative",
//   },
//   cardsHolder: {
//     overflowY: "auto",
//     maxHeight: "100%",
//     p: "20px",
//     pb: 0,
//   },
//   cardBody: {
//     height: 180,
//     p: "20px",
//     borderRadius: "10px",
//   },
//   cardHighlight: {
//     height: 180,
//     p: "20px",
//     borderWidth: "2px",
//     borderStyle: "solid",
//     borderColor: "primary.main",
//     borderRadius: "10px",
//   },
//   st_Button: {
//     width: "90%",
//     mt: 2,
//     position: "absolute",
//     bottom: "20px",
//     left: "50%",
//     mx: "auto",
//     transform: "translateX(-50%)",
//     "&.Mui-disabled": {
//       backgroundColor: "#A9A9A9",
//       color: "#FFFFFF",
//     },
//   },
//   mapContainerStyle: {
//     width: "100%",
//     height: "100%",
//     borderRadius: "8px",
//   },
// });

const useStyles = {
  leftStack: {
    direction: "row",
    spacing: 1,
    width: "25%",
    maxWidth: "302px",
    mr: 1,
    pb: "20px",
    height: "100%",
    position: "relative",
  },
  cardsHolder: {
    overflowY: "auto",
    maxHeight: "100%",
    p: "20px",
    pb: 0,
  },
  cardBody: {
    height: 180,
    p: "20px",
    borderRadius: "10px",
  },
  cardHighlight: {
    height: "auto",
    p: "20px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "primary.main",
    borderRadius: "10px",
  },
  cardLarge: {
    height: "auto",
    p: "20px",
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "primary.main",
    borderRadius: "10px",
  },
  st_Button: {
    width: "90%",
    mt: 2,
    position: "absolute",
    bottom: "20px",
    left: "50%",
    mx: "auto",
    transform: "translateX(-50%)",
    "&.Mui-disabled": {
      backgroundColor: "greyedOut",
      color: "#FFFFFF",
    },
  },
  mapContainerStyle: {
    width: "100%",
    height: "100%",
    borderRadius: "8px",
  },
};

export default useStyles;
// export default useStyle;
