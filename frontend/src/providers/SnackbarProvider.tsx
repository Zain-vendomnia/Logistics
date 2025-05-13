import { createContext, ReactNode, useContext, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

export type Severity = "success" | "error" | "warning" | "info";

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarContextType>({
  showSnackbar: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as Severity,
  });

  const showSnackbar = (message: string, severity: Severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
        variant="filled"
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ minWidth: "290px", mt: 4 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* <Snackbar
              open={openSnackbar}
              autoHideDuration={6000}
              onClose={() => setOpenSnackbar(false)}
              message={snackbarMessage}
              sx={{ "& .MuiSnackbarContent-root": { backgroundColor: "green" } }}
            /> */}
    </SnackbarContext.Provider>
  );
};

export default SnackbarProvider;
