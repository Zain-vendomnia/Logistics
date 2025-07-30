import pool from "../database";

class hereMapMapper {
  async saveRouteData(data: any) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const routeId = await this.saveRoute(connection, data.vehicleId);

      for (const section of data.sections ?? []) {
        const sectionId = await this.saveSection(
          connection,
          routeId,
          section.summary
        );
        await this.saveCoordinates(connection, sectionId, section.coordinates);
      }

      for (const stop of data.stops ?? []) {
        const stopId = await this.saveStop(connection, routeId, stop);
        await this.saveActivities(connection, stopId, stop.activities);
        await this.saveLoads(connection, stopId, stop.load);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.error("Failed to save route data:", error);
      throw new Error("Route data insertion failed.");
    } finally {
      connection.release();
    }
  }

  async saveUnassignedJobs(data: any) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const job of data ?? []) {
        const jobId = await this.saveUnassignedJob(connection, job.jobId);
        await this.saveReasons(connection, jobId, job.reasons);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      console.log("error saving unassigned jobs data", error);
      throw new Error("Uassigned Jobs data insertion failed");
    } finally {
      connection.release();
    }
  }

  private async saveRoute(connection: any, vehicleId: string): Promise<number> {
    const [result]: any = await connection.query(
      `INSERT INTO here_routes (vehicle_id) VALUES (?)`,
      [vehicleId]
    );
    return result.insertId;
  }

  private async saveSection(
    connection: any,
    routeId: number,
    summary: any
  ): Promise<number> {
    const { duration, length, baseDuration } = summary;
    const [result]: any = await connection.query(
      `INSERT INTO here_route_sections (duration, length, base_duration, route_id) VALUES (?, ?, ?, ?)`,
      [duration, length, baseDuration, routeId]
    );
    return result.insertId;
  }

  private async saveCoordinates(
    connection: any,
    sectionId: number,
    coordinates: any[]
  ) {
    for (const coord of coordinates) {
      const { lat, lng, z } = coord;
      await connection.query(
        `INSERT INTO here_sections_coordinates (lat, lng, z, section_id) VALUES (?, ?, ?, ?)`,
        [lat, lng, z, sectionId]
      );
    }
  }

  private async saveStop(
    connection: any,
    routeId: number,
    stop: any
  ): Promise<number> {
    const {
      arrivalTime,
      departureTime,
      location: { lat, lng },
      distance,
    } = stop;

    const [result]: any = await connection.query(
      `INSERT INTO here_route_stops (arrival_time, departure_time, location_lat, location_lng, distance, route_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [arrivalTime, departureTime, lat, lng, distance, routeId]
    );
    return result.insertId;
  }

  private async saveActivities(
    connection: any,
    stopId: number,
    activities: any[]
  ) {
    for (const activity of activities ?? []) {
      const { jobId, type, location, startTime, endTime } = activity;
      await connection.query(
        `INSERT INTO here_stop_activities (job_id, type, location_lat, location_lng, start_time, end_time, stop_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [jobId, type, location.lat, location.lng, startTime, endTime, stopId]
      );
    }
  }

  private async saveLoads(connection: any, stopId: number, loads: any[]) {
    for (const load of loads ?? []) {
      await connection.query(
        `INSERT INTO here_stop_loads (load_value, stop_id) VALUES (?, ?)`,
        [load, stopId]
      );
    }
  }

  private async saveUnassignedJob(
    connection: any,
    jobId: string
  ): Promise<number> {
    const [result]: any = await connection.query(
      `INSERT INTO here_unassigned_jobs (job_id) VALUES (?)`,
      [jobId]
    );
    return result.insertId;
  }

  private async saveReasons(
    connection: any,
    unassignedJobId: number,
    reasons: any[]
  ) {
    for (const reason of reasons ?? []) {
      const { code, description } = reason;
      await connection.query(
        `INSERT INTO here_unassigned_job_reasons (code, description, unassigned_job_id) VALUES (?, ?, ?)`,
        [code, description, unassignedJobId]
      );
    }
  }
}

export default new hereMapMapper();
