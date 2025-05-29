import pool from "../database";

export const updateCustomerInfoService = async (data: {
  order_id: number;
  street: string;
  zipcode: string;
  city: string;
  phone: string;
}) => {
  const { order_id, street, zipcode, city, phone } = data;

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
      order_id
    ]);

    if ((result as any).affectedRows === 0) {
      throw new Error(`No customer found with order_id: ${order_id}`);
    }

    return { message: "Customer updated successfully", affectedRows: (result as any).affectedRows };
  } catch (err) {
    console.error("❌ DB Update Error in updateCustomerInfoService:", err);
    throw err;
  }
};
