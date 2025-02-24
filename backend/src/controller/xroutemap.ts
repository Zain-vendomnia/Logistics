import { Request, Response } from "express";

export const getEstimate = async (req: Request, res: Response) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({ message: "Origin and destination are required" });
        }

        const estimate = await getRouteEstimateFromAPI(origin, destination);
        res.json(estimate);

    } catch (error: unknown) {
        // Assert that the error is an instance of Error
        if (error instanceof Error) {
            console.error("Error in getEstimate:", error);
            res.status(500).json({ message: "Error calculating route estimate", error: error.message });
        } else {
            // If the error is not an instance of Error, send a generic error response
            console.error("Unexpected error:", error);
            res.status(500).json({ message: "Unexpected error occurred", error: "Unknown error" });
        }
    }
};


// Example service to simulate fetching route estimate from an external API
const getRouteEstimateFromAPI = async (origin: string, destination: string) => {
    // Simulating an API call that might throw an error
    if (origin === "error") {
        throw new Error("Simulated API error");
    }
    
    return {
        origin,
        destination,
        estimatedTime: "5 hours",  // Example
        estimatedCost: "$50",      // Example
    };
};
