import {  Response } from "express"; // Correct import for Express types

export const getDriverBoard = ( res: Response): void => {
  try {
    // Example of driver-specific content. Replace this with real data from the database.
    const driverContent = {
      message: "Welcome to the Driver Board!", // This message can be dynamically generated
      data: [
        {
          id: 1,
          route: "Route 101",
          status: "Active", // Status can be dynamic (e.g., fetched from the database)
          estimatedTime: "2 hours"
        },
        {
          id: 2,
          route: "Route 202",
          status: "Inactive",
          estimatedTime: "3 hours"
        },
        {
          id: 3,
          route: "Route 303",
          status: "Active",
          estimatedTime: "1.5 hours"
        }
      ]
    };

    // Send the driver content as the response
    res.status(200).json(driverContent);
  } catch (err) {
    // TypeScript needs us to handle `err` properly since it's inferred as 'unknown'
    if (err instanceof Error) {
      // If `err` is an instance of `Error`, we can safely access its properties
      console.error("Error fetching driver content:", err.message);
      res.status(500).json({
        message: "Something went wrong while fetching the driver board content.",
        error: err.message
      });
    } else {
      // In case the error is not an instance of `Error`, we handle it generically
      console.error("Unexpected error:", err);
      res.status(500).json({
        message: "Something went wrong while fetching the driver board content.",
        error: "Unknown error"
      });
    }
  }
};
