import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

type Field = {
  name: string;
  label: string;
  type: string;
};

interface Props {
  onSubmit: (data: Record<string, string>) => void;
}

const createFormBuilder = (fields: Field[]) => {
  return function DynamicForm({ onSubmit }: Props) {
    const [formData, setFormData] = useState<Record<string, string>>(
      fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {})
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <Box component="form" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <TextField
            key={field.name}
            name={field.name}
            label={field.label}
            value={formData[field.name]}
            type={field.type}
            onChange={handleChange}
          />
        ))}
        <Button variant="contained" type="submit">
          Submit
        </Button>
      </Box>
    );
  };
};

export default createFormBuilder;
