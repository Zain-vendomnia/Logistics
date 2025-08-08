import pool from "../database";

/**
 * Syncs and updates the Shopware order and its items properly.
 * - Updates existing orders
 * - Syncs items: insert new, update existing, delete removed
 */
export const syncShopwareOrder = async (order: any): Promise<{ updated: boolean }> => {
  const connection = await pool.getConnection();
console.log("--------------------------------------------------------------------------------------------------------------------")
  console.log(order);
  try {
    await connection.beginTransaction();

    // Step 1: Check if order exists
    const [orderCheckRows]: any = await connection.execute(
      `SELECT order_id FROM logistic_order WHERE shopware_order_id = ?`,
      [order.orderID]
    );

    if (orderCheckRows.length === 0) {
      console.warn(`❌ Order ${order.orderID} not found in logistic_order`);
      await connection.rollback();
      return { updated: false };
    }

    const localOrderId = orderCheckRows[0].order_id;
    const firstItem = order.OrderDetails[0];

    // Step 2: Update order header
    const updateOrderQuery = `
      UPDATE logistic_order SET
        order_number = ?, invoice_amount = ?, payment_id = ?,
        warehouse_id = ?, customer_id = ?, customer_number = ?,
        firstname = ?, lastname = ?, email = ?,
        street = ?, zipcode = ?, city = ?, phone = ?,
        updated_at = NOW()
      WHERE shopware_order_id = ?
    `;

    await connection.execute(updateOrderQuery, [
      order.ordernumber,
      order.invoice_amount,
      order.paymentID,
      firstItem?.warehouse_id || null,
      order.user_id,
      order.customernumber,
      order.shipping_firstname || order.user_firstname,
      order.shipping_lastname || order.user_lastname,
      order.user_email,
      order.shipping_street,
      order.shipping_zipcode,
      order.shipping_city,
      order.shipping_phone,
      order.orderID,
    ]);

    // Step 3.1: Fetch current item IDs in DB
    const [currentItemsRows]: any = await connection.execute(
      `SELECT slmdl_article_id FROM logistic_order_items WHERE order_id = ?`,
      [localOrderId]
    );
    const currentItemIds = currentItemsRows.map((row: any) => row.slmdl_article_id);

    // Step 3.2: Collect incoming item IDs
    const incomingItemIds = order.OrderDetails.map((item: any) => item.slmdl_article_id);

    // Step 3.3: Identify and delete removed items
    const itemsToDelete = currentItemIds.filter((id: any) => !incomingItemIds.includes(id));
    if (itemsToDelete.length > 0) {
      const placeholders = itemsToDelete.map(() => '?').join(',');
      await connection.execute(
        `DELETE FROM logistic_order_items WHERE order_id = ? AND slmdl_article_id IN (${placeholders})`,
        [localOrderId, ...itemsToDelete]
      );
    }

    // Step 3.4: Upsert items (update or insert)
    for (const item of order.OrderDetails) {
      console.log(`Processing item: ${item.slmdl_article_id} - ${item.slmdl_articleordernumber}`);
      const [existingItemRows]: any = await connection.execute(
        `SELECT * FROM logistic_order_items WHERE order_id = ? AND slmdl_article_id = ?`,
        [localOrderId, item.slmdl_article_id]
      );

      if (existingItemRows.length > 0) {
        const existing = existingItemRows[0];

        if (
          existing.quantity !== item.slmdl_quantity ||
          existing.slmdl_articleordernumber !== item.slmdl_articleordernumber ||
          existing.warehouse_id !== item.warehouse_id
        ) {
          await connection.execute(
            `UPDATE logistic_order_items SET
              quantity = ?, slmdl_articleordernumber = ?, warehouse_id = ?, updated_at = NOW()
             WHERE order_id = ? AND slmdl_article_id = ?`,
            [
              item.slmdl_quantity,
              item.slmdl_articleordernumber,
              item.warehouse_id,
              localOrderId,
              item.slmdl_article_id,
            ]
          );
        }
        // else: no changes needed
      } else {
        await connection.execute(
          `INSERT INTO logistic_order_items (
            order_id, order_number, slmdl_article_id,
            slmdl_articleordernumber, quantity, warehouse_id,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            localOrderId,
            order.ordernumber,
            item.slmdl_article_id,
            item.slmdl_articleordernumber,
            item.slmdl_quantity,
            item.warehouse_id,
          ]
        );
      }
    }
    console.log("--------------------------------------------------------------------------------------------------------------------")

    await connection.commit();
    return { updated: true };

  } catch (error: any) {
    await connection.rollback();
    console.error(`❌ Order sync failed for ${order.orderID}:`, error.message);
    throw new Error(`Sync failed: ${error.message}`);
  } finally {
    connection.release();
  }
};
