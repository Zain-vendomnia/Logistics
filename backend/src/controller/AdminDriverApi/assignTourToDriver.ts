import { Request, Response } from 'express';
import pool from '../../database';

export async function assignTourToDriver(req: Request, res: Response) {
  const { driverId, tourId } = req.body;

  if (!driverId || !tourId) {
    return res.status(400).json({ message: 'Missing driverId or tourId' });
  }

  try {
    // Check if the tour is available and if the driver exists
    const [driverExists]: any = await pool.execute(
      `SELECT * FROM drivers WHERE id = ?`, [driverId]
    );

    if (!driverExists) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Assign the tour to the driver
    await pool.execute(
      `INSERT INTO driver_tours (driver_id, tour_id, assigned_at) VALUES (?, ?, NOW())`,
      [driverId, tourId]
    );

    return res.status(200).json({ message: `Tour ${tourId} assigned to driver ${driverId}` });

  } catch (error) {
    console.error('Error in assignTourToDriver:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
