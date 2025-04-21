import pool from '../database'; 

interface Tour {
  tourName: string;
  comments: string;
  startTime: string;
  endTime: string;
  driverid: number;
  routeColor: string;
  tourDate : Date;
  orderIds: number[];
}

// Function to insert a tour into the database
export const createTour = async (tour: Tour) => {
  const sql = `
    INSERT INTO tourinfo_master (tour_name, comments, start_time, end_time, driver_id, route_color, tour_date, order_ids)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
   
  const values = [
    tour.tourName,
    tour.comments,
    tour.startTime,
    tour.endTime,
    tour.driverid,
    tour.routeColor,
    tour.tourDate,
    JSON.stringify(tour.orderIds),
  ];
  console.log('SQL Query:', sql);
  console.log('Values:', values);
  try {
     
    const [result] = await pool.query(sql, values); // Use pool.query to execute SQL
    console.log('Query result:', result);
    return result; // return the result of the query
  } catch (err) {
    throw err; // Pass the error to the controller or caller
  }
};
