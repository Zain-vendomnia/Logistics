import React, { useEffect } from "react";

const TestUnhandledPromise = () => {
  useEffect(() => {
    // unhandled fetch or async error
    new Promise((_res, rej) => {
      setTimeout(() => {
        rej(new Error("unhandled Promise -- test"));
      }, 3000);
    });
  }, []);

  return <div>Unhandled Promise Error -- Test</div>;
};

export default TestUnhandledPromise;
