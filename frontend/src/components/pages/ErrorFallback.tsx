import { Box, Button, Typography } from "@mui/material";

type Props = { error: Error };

export const ErrorFallback = ({ error }: Props) => (
  <Box style={{ padding: "3rem", textAlign: "center" }}>
    <Typography variant={"h1"}>Oops! Something went wrong.</Typography>
    <Typography variant={"body1"}>{error.message}</Typography>
    <Button onClick={() => window.location.reload()}>Reload Page</Button>
  </Box>
);
