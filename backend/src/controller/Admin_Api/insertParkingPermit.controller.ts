import { Request, Response } from 'express';
import { insertFormData } from "../../services/parkingPermit.service";

export const insertParkingPermit = async (req: Request, res: Response) => {


	try {	
	  const {
	    orderNumber,
	    parkingLocation,
	    customer_signature,
	  } = req.body;


	  const base64Data = customer_signature.split(",")[1];
	  const imageBuffer = Buffer.from(base64Data, 'base64');

	  // Insert into database
	  const result = await insertFormData({
	    orderNumber,
	    parkingLocation,
	    image: imageBuffer,
	  });


	  return res.status(201).json({
	    message: "Data added successfully",
	    data: result,
	  });


	} catch (error) {
	  console.error("❌ Error inserting route segment:", error);

	  return res.status(500).json({
	    message: "Something went wrong while adding the data.",
	  });
	}
};