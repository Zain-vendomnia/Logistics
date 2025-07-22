import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { registerGlobalErrorHandlers } from "../utils/globalErrorHandlers";

registerGlobalErrorHandlers();

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <ErrorBoundary>
      <BrowserRouter>{children}</BrowserRouter>
    </ErrorBoundary>
  );
};
