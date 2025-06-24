import { Box } from "@mui/material";

const ScrollContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      sx={{
        overflowY: "auto",
        overflowX: "hidden",
        maxHeight: "100%",
        pr: 1,
        // scrollbarColor: (theme) => theme.palette.primary.main,
        // scrollbarWidth: "none", // Firefox
        // "&::-webkit-scrollbar": {
        //   display: "none", // Chrome, Safari
        // },
      }}
    >
      {children}
    </Box>
  );
};

export default ScrollContainer;
