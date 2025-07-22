import React, { useEffect, useState } from "react";

const TestRuntimeError = () => {
    useEffect(() => {
      setTimeout(() => {
        throw new Error("Runtime error on timeout -- Test");
      }, 2000);
    });

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setTimeout(() => {
      try {
        throw new Error("🔥 Runtime Error from timeout");
      } catch (err) {
        if (err instanceof Error) {
          console.error("Caught inside component:", err);
          setError(err);
        }
      }
    }, 2000);
  }, []);

  if (error) {
    return <div style={{ color: "red" }}>Component error: {error.message}</div>;
  }

  return <div>Test Runtime Error</div>;
};

export default TestRuntimeError;
