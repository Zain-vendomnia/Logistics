import pool from "../config/database";
import { 
  broadcastCustomerList, 
  broadcastSingleCustomerUpdate,
  sendInitialCustomerList,
  sendCustomerListError,
  hasConnectedAdmins,
  getIO
} from "../config/socket";

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

interface DatabaseRow {
  order_id: string;
  order_number: string;
  name: string;
  phone?: string;
  status?: string;
  message_type?: string;
  body?: string;
  message_created_at?: Date;
  unread_count: number;
}

interface ServiceResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

const baseCustomerQuery = `
  SELECT 
    l.order_id,
    l.order_number,
    TRIM(CONCAT(COALESCE(l.firstname, ''), ' ', COALESCE(l.lastname, ''))) AS name,
    l.phone,
    l.status,
    wc.message_type,
    wc.body,
    wc.created_at AS message_created_at,
    COALESCE(unread.unread_count, 0) AS unread_count
  FROM logistic_order l
  LEFT JOIN (
    SELECT order_id, message_type, body, created_at,
           ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) AS rn
    FROM whatsapp_chats 
    WHERE order_id IS NOT NULL AND order_id != ''
  ) wc ON l.order_id = wc.order_id AND wc.rn = 1
  LEFT JOIN (
    SELECT order_id, COUNT(*) AS unread_count
    FROM whatsapp_chats 
    WHERE is_read = 0 AND direction = 'inbound'
    GROUP BY order_id
  ) unread ON l.order_id = unread.order_id
`;

const mapRowToCustomer = (row: DatabaseRow): Customer => ({
  order_id: row.order_id,
  order_number: row.order_number,
  name: row.name || "Unknown Customer",
  phone: row.phone,
  message_type: row.message_type,
  status: row.status,
  lastMessage: row.body || "",
  timestamp: row.message_created_at?.toISOString(),
  unreadCount: row.unread_count || 0,
});

export const initializeCustomerServiceSocketListeners = () => {
  try {
    const io = getIO();
    io.on('connection', (socket) => {
      socket.on('request-initial-customer-list', async (data) => {
        try {
          const customers = await getAllCustomers();
          sendInitialCustomerList(data.socketId, customers);
        } catch (error) {
          sendCustomerListError(data.socketId, 'Failed to load initial customer list', 'initial_load');
        }
      });

      socket.on('request-customer-list-refresh', async (data) => {
        try {
          const customers = await getAllCustomers();
          sendInitialCustomerList(data.socketId, customers);
        } catch (error) {
          sendCustomerListError(data.socketId, 'Failed to refresh customer list', 'manual_refresh');
        }
      });
    });
  } catch (error) {
    console.error('Error initializing customer service socket listeners:', error);
  }
};

export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    // Combined query for both inTransit and unread messages
    const query = `
      ${baseCustomerQuery}
      WHERE l.order_id IS NOT NULL 
        AND l.order_id != '' 
        AND (
          l.status = 'inTransit' OR
          EXISTS (
            SELECT 1 FROM whatsapp_chats wc_unread 
            WHERE wc_unread.order_id = l.order_id 
              AND wc_unread.is_read = 0 
              AND wc_unread.direction = 'inbound'
          )
        )
      ORDER BY COALESCE(wc.created_at, l.created_at) DESC
    `;

    const [rows] = await pool.query(query) as [DatabaseRow[], any];
    const customers = rows.map(mapRowToCustomer);
    
    console.log(`Total customers: ${customers.length} (InTransit + Unread)`);
    return customers;
    
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers from database");
  }
};

export const handleNewMessage = async (messageData: any, orderId: string) => {
  try {
    if (!hasConnectedAdmins()) return;

    const customer = await getCustomerById(orderId);
    if (customer) {
      broadcastSingleCustomerUpdate(customer, 'message_received', {
        messageId: messageData.id,
        messageContent: messageData.body || messageData.content,
        messageType: messageData.message_type
      });
    }
  } catch (error) {
    console.error('Error handling new message for customer list:', error);
  }
};

export const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }

    const sanitizedSearchTerm = searchTerm.trim();
    const query = `
      ${baseCustomerQuery}
      WHERE l.order_id IS NOT NULL 
        AND l.order_id != '' 
        AND (
          l.order_number LIKE ? 
          OR l.phone LIKE ? 
          OR TRIM(CONCAT(COALESCE(l.firstname, ''), ' ', COALESCE(l.lastname, ''))) LIKE ?
        )
      ORDER BY COALESCE(wc.created_at, l.created_at) DESC
    `;

    const likeTerm = `%${sanitizedSearchTerm}%`;
    const [rows] = await pool.query(query, [likeTerm, likeTerm, likeTerm]) as [DatabaseRow[], any];
    
    return rows.map(mapRowToCustomer);
  } catch (error) {
    console.error("Error searching customers:", error);
    throw error instanceof Error ? error : new Error("Failed to search customers");
  }
};

export const searchCustomersWithResponse = async (searchTerm: string): Promise<ServiceResponse<Customer[]>> => {
  try {
    const trimmedSearchTerm = searchTerm?.trim();
    
    if (!trimmedSearchTerm || trimmedSearchTerm.length < 2) {
      return {
        status: "error",
        message: "Search term must be at least 2 characters long.",
        data: []
      };
    }
    
    if (trimmedSearchTerm.length > 100) {
      return {
        status: "error",
        message: "Search term cannot exceed 100 characters.",
        data: []
      };
    }

    const customers = await searchCustomers(trimmedSearchTerm);
    
    return {
      status: "success",
      message: customers.length === 0 
        ? `No customers found matching "${trimmedSearchTerm}"`
        : `Found ${customers.length} customer(s) matching "${trimmedSearchTerm}"`,
      data: customers
    };
    
  } catch (error) {
    return {
      status: "error",
      message: "Internal server error occurred while searching customers.",
      data: []
    };
  }
};

export const getCustomerById = async (orderId: string): Promise<Customer | null> => {
  try {
    const query = `${baseCustomerQuery} WHERE l.order_id = ? LIMIT 1`;
    const [rows] = await pool.query(query, [orderId]) as [DatabaseRow[], any];
    return rows.length > 0 ? mapRowToCustomer(rows[0]) : null;
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw new Error("Failed to fetch customer");
  }
};

// Simplified periodic refresh
export const periodicCustomerListRefresh = async () => {
  if (!hasConnectedAdmins()) return;
  const customers = await getAllCustomers();
  broadcastCustomerList(customers, 'periodic_refresh');
};

// Simplified broadcast refresh
export const broadcastCustomerListRefresh = async (triggerReason?: string) => {
  if (!hasConnectedAdmins()) return;
  const customers = await getAllCustomers();
  broadcastCustomerList(customers, triggerReason);
};