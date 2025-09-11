import pool from "../database";

export interface Customer {
  order_id: string;
  order_number: string;
  name: string;
  phone?: string;
  message_type?: string;
  status?: string;
  lastMessage: string;
  timestamp?: string;
  unreadCount: number;
}

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        l.order_id,
        l.order_number,
        TRIM(CONCAT(COALESCE(l.firstname, ''), ' ', COALESCE(l.lastname, ''))) as name,
        l.phone,
        l.status,
        
        -- Latest message details
        wc.message_type,
        wc.body,
        wc.created_at as message_created_at,
        
        -- Total unread count for this order
        COALESCE(unread.unread_count, 0) as unread_count

      FROM logistic_order l

      -- Get the most recent message for each order
      LEFT JOIN (
          SELECT 
              order_id,
              message_type,
              body,
              created_at,
              ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) as rn
          FROM whatsapp_chats 
          WHERE order_id IS NOT NULL AND order_id != ''
      ) wc ON l.order_id = wc.order_id AND wc.rn = 1

      -- Count total unread messages for each order (is_read = 1 means unread)
      LEFT JOIN (
          SELECT 
              order_id,
              COUNT(*) as unread_count
          FROM whatsapp_chats 
          WHERE is_read = 0
              AND direction = 'inbound' 
          GROUP BY order_id
      ) unread ON l.order_id = unread.order_id

      WHERE l.order_id IS NOT NULL AND l.order_id != ''

      ORDER BY 
          CASE 
              WHEN wc.created_at IS NOT NULL THEN wc.created_at 
              ELSE l.created_at 
          END DESC;
    `);

    return rows.map((row: any): Customer => ({
      order_id: row.order_id,
      order_number: row.order_number,
      name: row.name || "Unknown Customer",
      phone: row.phone,
      message_type: row.message_type,
      status: row.status,
      lastMessage: row.body,
      timestamp: row.message_created_at,
      unreadCount: row.unread_count || 0,
    }));
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
};
