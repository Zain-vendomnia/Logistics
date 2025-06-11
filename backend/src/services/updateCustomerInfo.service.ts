import pool from "../database";

export const updateCustomerInfoService = async (data: {
  order_id: number;
  street: string;
  zipcode: string;
  city: string;
  phone: string;
  notice: string;
  tourId: number; 

}) => {
  const { order_id, street, zipcode, city, phone, notice , tourId } = data;

  try {
    const query = `
      UPDATE logistic_order 
      SET street = ?, zipcode = ?, city = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `;

    const [result] = await pool.query(query, [
      street,
      zipcode,
      city,
      phone,
      order_id,
      tourId
    ]);

    
    if ((result as any).affectedRows === 0) {
      throw new Error(`No customer found with order_id: ${order_id}`);
    }
    
      const updateRouteSegmentQuery = `
        UPDATE route_segments
        SET comments = ?
        WHERE order_id = ? and tour_id = ?
      `;
      await pool.query(updateRouteSegmentQuery, [notice, order_id, tourId]);

console.log('SQL Query Preview:', updateRouteSegmentQuery);
console.log('With values:', [notice, order_id, tourId]);
    return { message: "Customer updated successfully", affectedRows: (result as any).affectedRows };
  } catch (err) {
    console.error("❌ DB Update Error in updateCustomerInfoService:", err);
    throw err;
  }
};
