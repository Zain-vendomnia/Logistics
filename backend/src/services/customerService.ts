import pool from "../config/database";

export interface Customer {
  order_id: string;
  order_number: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  last_message?: string;
  last_message_at?: string;
  last_communication_channel?: string;
  unread_count?: number;
  has_unread?: boolean;
}

interface DatabaseRow {
  order_id: string;
  order_number: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
  last_message?: string;
  last_message_at?: string;
  last_communication_channel?: string;
  unread_count?: number;
  has_unread?: boolean;
}

const mapRowToCustomer = (row: DatabaseRow): Customer => ({
  order_id: row.order_id,
  order_number: row.order_number,
  name: row.name || "Unknown Customer",
  phone: row.phone,
  email: row.email,
  status: row.status,
  last_message: row.last_message,
  last_message_at: row.last_message_at,
  last_communication_channel: row.last_communication_channel,
  unread_count: row.unread_count || 0,
  has_unread: row.has_unread || false,
});

// Get all customers with inTransit status - UNREAD FIRST
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const query = `
      SELECT 
        lo.order_id,
        lo.order_number,
        TRIM(CONCAT(COALESCE(lo.firstname, ''), ' ', COALESCE(lo.lastname, ''))) AS name,
        lo.phone,
        lo.email,
        lo.status,
        cc.last_message,
        cc.last_message_at,
        cc.last_communication_channel,
        CASE WHEN cc.convo_is_read = 0 THEN 1 ELSE 0 END AS has_unread,
        CASE 
          WHEN cc.convo_is_read = 0 THEN 
            (SELECT COUNT(*) 
             FROM JSON_TABLE(
               cc.convo, 
               '$[*]' COLUMNS(
                 direction VARCHAR(20) PATH '$.direction',
                 is_read INT PATH '$.is_read'
               )
             ) AS jt 
             WHERE jt.direction = 'inbound' AND jt.is_read = 0
            )
          ELSE 0 
        END AS unread_count
      FROM logistic_order lo
      LEFT JOIN customer_chats cc ON lo.order_id = cc.order_id
      WHERE lo.order_id IS NOT NULL 
        AND lo.order_id != '' 
        AND lo.status = 'inTransit'
      ORDER BY 
        has_unread DESC,
        cc.last_message_at DESC,
        lo.created_at DESC
    `;

    const [rows] = await pool.query(query) as [DatabaseRow[], any];
    const customers = rows.map(mapRowToCustomer);
    
    const unreadCount = customers.filter(c => c.has_unread).length;
    
    console.log(`Total customers: ${customers.length} | Unread: ${unreadCount}`);
    
    return customers;
    
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers from database");
  }
};