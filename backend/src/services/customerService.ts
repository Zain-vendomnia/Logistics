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

// API Response interface for consistency
interface ServiceResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

// Common base SQL query without WHERE clause
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
    SELECT 
      order_id,
      message_type,
      body,
      created_at,
      ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) AS rn
    FROM whatsapp_chats 
    WHERE order_id IS NOT NULL AND order_id != ''
  ) wc ON l.order_id = wc.order_id AND wc.rn = 1
  LEFT JOIN (
    SELECT 
      order_id,
      COUNT(*) AS unread_count
    FROM whatsapp_chats 
    WHERE is_read = 0 
      AND direction = 'inbound'
    GROUP BY order_id
  ) unread ON l.order_id = unread.order_id
`;

// Map database row to Customer interface
const mapRowToCustomer = (row: any): Customer => ({
  order_id: row.order_id,
  order_number: row.order_number,
  name: row.name || "Unknown Customer",
  phone: row.phone,
  message_type: row.message_type,
  status: row.status,
  lastMessage: row.body,
  timestamp: row.message_created_at,
  unreadCount: row.unread_count || 0,
});

// Get all customers (returns array directly for backward compatibility)
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    const query = `
      ${baseCustomerQuery}
      WHERE l.order_id IS NOT NULL 
        AND l.order_id != '' 
        AND l.status = 'inTransit'
      ORDER BY COALESCE(wc.created_at, l.created_at) DESC
    `;

    console.log("Executing getAllCustomers query...");
    const [rows]: any = await pool.query(query);
    
    const customers = rows.map(mapRowToCustomer);
    console.log(`Retrieved ${customers.length} customers from database`);
    
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers from database");
  }
};

// Search customers with enhanced error handling and logging
export const searchCustomers = async (searchTerm: string): Promise<Customer[]> => {
  try {
    console.log(`Starting customer search for term: "${searchTerm}"`);
    
    // Validate search term at service level as well
    if (!searchTerm || searchTerm.trim().length < 2) {
      console.warn("Invalid search term provided to service layer");
      throw new Error("Search term must be at least 2 characters long");
    }

    const sanitizedSearchTerm = searchTerm.trim();
    
    // Enhanced search query - searching in name, order_number, and phone
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
    console.log(`Executing search query with term: "${likeTerm}"`);
    
    const [rows]: any = await pool.query(query, [likeTerm, likeTerm, likeTerm]);
    
    const customers = rows.map(mapRowToCustomer);
    console.log(`Search completed. Found ${customers.length} customers matching "${sanitizedSearchTerm}"`);
    
    return customers;
  } catch (error) {
    console.error("Error searching customers:", error);
    
    // Re-throw with more specific error message
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error("Failed to search customers in database");
  }
};

// Optional: Enhanced search with response wrapper (if needed for future use)
export const searchCustomersWithResponse = async (searchTerm: string): Promise<ServiceResponse<Customer[]>> => {
  try {
    // Validate search term
    if (!searchTerm || typeof searchTerm !== 'string') {
      return {
        status: "error",
        message: "Search term must be a non-empty string.",
        data: []
      };
    }
    
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm.length < 2) {
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

    // Perform search
    const customers = await searchCustomers(trimmedSearchTerm);
    
    // Return success response
    if (customers.length === 0) {
      return {
        status: "success",
        message: `No customers found matching "${trimmedSearchTerm}"`,
        data: []
      };
    }
    
    return {
      status: "success",
      message: `Found ${customers.length} customer(s) matching "${trimmedSearchTerm}"`,
      data: customers
    };
    
  } catch (error) {
    console.error("Error in searchCustomersWithResponse:", error);
    
    return {
      status: "error",
      message: "Internal server error occurred while searching customers.",
      data: []
    };
  }
};

// Get customer by ID (utility function)
export const getCustomerById = async (orderId: string): Promise<Customer | null> => {
  try {
    const query = `
      ${baseCustomerQuery}
      WHERE l.order_id = ?
      LIMIT 1
    `;

    const [rows]: any = await pool.query(query, [orderId]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return mapRowToCustomer(rows[0]);
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    throw new Error("Failed to fetch customer");
  }
};