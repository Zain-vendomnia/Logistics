import React, { useState } from "react";
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import * as AuthService from "../../services/auth.service";
import { login } from "../../services/auth.service";

import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  Avatar,
} from "@mui/material";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

type Props = {}

const Login: React.FC<Props> = () => {
  let navigate: NavigateFunction = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const initialValues: {
    username: string;
    password: string;
  } = {
    username: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string().required("This field is required!"),
    password: Yup.string().required("This field is required!"),
  });

  const handleLogin = (formValue: { username: string; password: string }) => {
    const { username, password } = formValue;

    setMessage("");
    setLoading(true);

    login(username, password).then(
      () => {
        const user = AuthService.getCurrentUser();
        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") {
          navigate("/Admin_dashboard");
        } else if (user.role === "driver") {
          navigate("/driver");
        } else if (user.role === "super_admin") {
          navigate("/super_admin");
        }
        window.location.reload();
      },
      (error) => {
        const resMessage =
          (error.response &&
            error.response.data &&
            error.response.data.message) ||
          error.message ||
          error.toString();
        setLoading(false);
        setMessage(resMessage);
      }
    );
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="calc(100vh - 50px)"
      bgcolor="#f5f5f5"
    >
      <Card sx={{ width: 350, p: 3, boxShadow: 3 }}>
        <Box display="flex" justifyContent="center" mb={2}>
          <Avatar sx={{ bgcolor: "primary.main", width: 60, height: 60 }}>
            <AccountCircleIcon fontSize="large" />
          </Avatar>
        </Box>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Login
          </Typography>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {({ errors, touched }) => (
              <Form>
                <Box mb={2}>
                  <Field
                    as={TextField}
                    name="username"
                    label="Username"
                    fullWidth
                    variant="outlined"
                    error={touched.username && Boolean(errors.username)}
                    helperText={<ErrorMessage name="username" />}
                  />
                </Box>
                <Box mb={2}>
                  <Field
                    as={TextField}
                    name="password"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="outlined"
                    error={touched.password && Boolean(errors.password)}
                    helperText={<ErrorMessage name="password" />}
                  />
                </Box>
                <Box mb={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </Box>

                {message && (
                  <Box mb={2}>
                    <Typography color="error" align="center">
                      {message}
                    </Typography>
                  </Box>
                )}
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
