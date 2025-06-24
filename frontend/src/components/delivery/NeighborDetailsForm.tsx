import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { TextField, Button, Box, Typography } from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper";
import { motion } from "framer-motion";
import { useShakeEvery } from "../base-ui/useShakeEvery";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { useHeadingUnderline } from "../base-ui/useHeadingUnderline";
import { UnderlineElement } from "../base-ui/UnderlineElement";

const getHelperText = (error?: string | undefined) => (
  <Typography component="span" sx={{ fontSize: "1.2rem", color: "error.main" }}>
    {error || " "}
  </Typography>
);

const schema = yup.object({
  name: yup
    .string()
    .required("Neighbor's name is required")
    .min(2, "Too short"),
  address: yup
    .string()
    .required("Address is required")
    .min(5, "Must be atleat 5 charchters long"),
  phone: yup
    .string()
    .notRequired()
    // .nullable()
    .transform((value) => (value === undefined ? "" : value))
    // .matches(/^(?:\+?\d{1,3}|0)\d{6,14}$/, "Phone number must be 10 digits"),
    .test("is-valid-phone", "Invalid phone number", (value) => {
      if (!value || value.trim() === "") return true; // skip if empty
      return /^(?:\+?\d{1,3}|0)\d{6,14}$/.test(value);
    }),

  email: yup.string().email("Invalid email address"),
});

type FormData = yup.InferType<typeof schema>;

interface Props {
  onComplete: () => void;
}

const NeighborDetailsForm = ({ onComplete }: Props) => {
  const { showNotification } = useNotificationStore();

  const [modalKey, setModalKey] = useState(0);
  const [showModal, setShowModal] = useState(true);

  const [neighborDetails, setNeighborDetails] = useState<FormData>();

  const [isUserActive, setIsUserActive] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const { controls, isInputFocused, handleFocusIn, handleFocusOut } =
    useHeadingUnderline();

  const handleFocus = () => {
    setIsUserActive(true);
    handleFocusIn();
  };
  const handleBlur = () => {
    setIsUserActive(false);

    // handleFocusOut();
  };
  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setHasTyped(val.trim() !== "");
    };

  useEffect(() => {
    setShouldAnimate(!isUserActive && !hasTyped);
  }, [isUserActive, hasTyped]);

  const { key, animation } = useShakeEvery(shouldAnimate);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    setNeighborDetails(data);
    console.log("Form Data:", data);

    reset();
    setShowModal(false);
    onComplete();
  };

  const handleModalClose = () => {
    if (!neighborDetails) {
      setShowModal(false); // force close

      showNotification({
        message: "Please enter neighbor details before continuing.",
        severity: NotificationSeverity.Warning,
      });

      setTimeout(() => {
        setModalKey((prev) => prev + 1);
        setShowModal(true);
      }, 900);

      return;
    }

    setShowModal(false);
  };

  return (
    <ModalWrapper key={modalKey} open={showModal} onClose={handleModalClose}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          maxWidth: 400,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          pb: 4,
          gap: 3,
          "& .MuiInputBase-input": {
            fontFamily: "'Roboto Mono', monospace",
            fontSize: "1.3rem",
          },
          "& .MuiInputLabel-root": {
            fontSize: "1.2rem",
            fontWeight: "bold",
          },
        }}
      >
        <motion.div
          animate={controls}
          initial={{ y: 0 }}
          style={{ marginBottom: 10 }}
        >
          <motion.div key={key} animate={animation}>
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Neighbor Details
              <UnderlineElement isInputFocused={isInputFocused} />
            </Typography>
          </motion.div>
        </motion.div>

        <TextField
          label="Name*"
          {...register("name")}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            setHasTyped(e.target.value.trim() !== "");
            register("name").onChange(e);
          }}
          error={!!errors.name}
          helperText={getHelperText(errors.name?.message)}
        />

        <TextField
          label="Address*"
          {...register("address")}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => {
            setHasTyped(e.target.value.trim() !== "");
            register("address").onChange(e);
          }}
          error={!!errors.address}
          helperText={getHelperText(errors.address?.message)}
        />

        {/* <TextField
          label="Phone"
          type="tel"
          inputMode="tel"
          {...register("phone", {
            onChange: (e) => {
              handleChange("phone")(e);
            },
          })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // onChange={(e) => {
          //   setHasTyped(e.target.value.trim() !== "");
          //   register("phone").onChange(e);
          // }}
          error={!!errors.phone}
          helperText={getHelperText(errors.phone?.message)}
          onKeyDown={(e) => {
            const allowedKeys = [
              "Backspace",
              "ArrowLeft",
              "ArrowRight",
              "Delete",
              "Tab",
            ];
            if (!/[\d+]/.test(e.key) && !allowedKeys.includes(e.key)) {
              e.preventDefault();
            }
          }}
        />

        <TextField
          label="Email"
          {...register("email", {
            onChange: (e) => {
              handleChange("email")(e);
            },
          })}
          onFocus={handleFocus}
          onBlur={handleBlur}
          // onChange={(e) => {
          //   setHasTyped(e.target.value.trim() !== "");
          //   register("email").onChange(e);
          // }}
          error={!!errors.email}
          helperText={getHelperText(errors.email?.message)}
        /> */}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ marginTop: 2 }}
        >
          Submit
        </Button>
      </Box>
    </ModalWrapper>
  );
};

export default NeighborDetailsForm;
