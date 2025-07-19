import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Stack, TextField, Typography } from "@mui/material";

interface Props {
  label: string;
  placeholder: string;
  value?: string;
  isDisabled?: boolean;
  blinkAlert?: boolean;
  onChange?: (value: string) => void;
}

const MAX_DIGITS = 9;
const MIN_DIGITS = 2;

const CustomInputField = ({
  label,
  placeholder,
  value,
  isDisabled = false,
  onChange,
}: Props) => {
  const [rawValue, setRawValue] = useState(value ?? "");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // useEffect(() => {
  //   if (blinkAlert && !isAlert) {
  //     setIsAlert(true);
  //   }

  //   const timeout = setTimeout(() => {
  //     setIsAlert(false);
  //   }, 3000);

  //   return () => clearTimeout(timeout);
  // }, [blinkAlert]);

  //   useEffect(() => {
  //     if (!rawValue) return;

  //     if (debounceRef.current) {
  //       clearTimeout(debounceRef.current);
  //     }

  //     debounceRef.current = setTimeout(() => {
  //       if (rawValue.length < MIN_DIGITS) {
  //         setError(true);
  //       } else {
  //         setError(false);
  //       }

  //       onChange(rawValue);
  //     }, 2000);

  //     return () => {
  //       if (debounceRef.current) {
  //         clearTimeout(debounceRef.current);
  //       }
  //     };
  //   }, [rawValue, onChange]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (digitsOnly.length > MAX_DIGITS) return;

    if (digitsOnly.length >= MIN_DIGITS) {
      setError(false);
    }

    setRawValue(digitsOnly);
    onChange?.(digitsOnly);
  };

  const handleBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (rawValue.length < MIN_DIGITS) {
      setError(true);
    } else {
      setError(false);
      onChange?.(rawValue);
    }
  };


  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight="bold">
        {label}
      </Typography>
      <TextField
        disabled={isDisabled}
        inputRef={inputRef}
        name="inputField"
        type="text"
        value={rawValue}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        fullWidth
        error={error}
        helperText={
          error ? (
            <Typography
              fontSize={"1.2rem"}
              fontWeight={"bold"}
              color="error.main"
              p={0}
            >
              Minimum {MIN_DIGITS} digits required
            </Typography>
          ) : (
            " "
          )
        }
        slotProps={{
          input: {
            inputMode: "numeric",
            style: {
              fontFamily: "'Roboto Mono', monospace",
              fontSize: "1.32rem",
              letterSpacing: "0.7rem",
            },
          },
        }}
        sx={{
          borderRadius: 2,
          "& input::placeholder": {
            fontFamily: `'Roboto Mono', monospace`,
            fontSize: "1.30rem",
            opacity: 0.5,
            letterSpacing: "0.7rem",
            // color: "#fff",
          },
          // ...(isAlert && {
          //   animation: "blink-border 1s ease-in-out 4",
          //   border: "2px solid red",
          //   borderRadius: 1,
          // }),
          // "@keyframes blink-border": {
          //   "0%": {
          //     borderColor: "red",
          //   },
          //   "50%": {
          //     borderColor: "transparent",
          //   },
          //   "100%": {
          //     borderColor: "red",
          //   },
          // },
        }}
      />
    </Stack>
  );
};

export default CustomInputField;
