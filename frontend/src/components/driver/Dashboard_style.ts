// import { makeStyles } from "@mui/styles";
// import { makeStyles } from "@mui/material";

// const useStyles = makeStyles({
//   cardsHolder: {
//     overflowY: "auto",
//     maxHeight: "calc(100% - 60px)", // Adjusted to account for the button height
//     p: "20px",
//     border: "0.5px solid #e0e0e0",
//     borderRadius: "8px",
//     position: "relative",
//   },
//   cardBody: {
//     height: 200,
//     p: "20px",
//     border: "2px solid primary.main",
//     borderRadius: "10px",
//   },
//   st_Button: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     width: "100%",
//     borderRadius: "0 0 8px 8px", // Match the border radius of the container
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
    mr: 1,
    pb: "20px",
    border: "0.5px solid #e0e0e0",
    borderRadius: "8px",
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
    height: 180,
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
    bottom: '20px',
    left: '50%',
    mx: "auto",
    transform: "translateX(-50%)",
    "&.Mui-disabled": {
      backgroundColor: "#A9A9A9",
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
