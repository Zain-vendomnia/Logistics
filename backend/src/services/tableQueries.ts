export const CREATE_WAREHOUSE_DETAILS_TABLE = `
CREATE TABLE IF NOT EXISTS warehouse_details (
    warehouse_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    warehouse_name VARCHAR(100) NOT NULL,
    clerk_name VARCHAR(45) NOT NULL,
    clerk_mob VARCHAR(20) NOT NULL,
    address VARCHAR(110) NOT NULL,
    email VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(45) DEFAULT NULL,
    latitude VARCHAR(20) DEFAULT NULL,
    longitude VARCHAR(20) DEFAULT NULL,
    zip_code VARCHAR(12) NOT NULL,
    town VARCHAR(60) NOT NULL,
    zip_codes_delivering TEXT DEFAULT NULL,
    color_code VARCHAR(7) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1
);
`;

export const INSERT_WAREHOUSE_DETAILS_DATA = `
INSERT INTO warehouse_details
  (warehouse_id, warehouse_name, clerk_name, clerk_mob, email, address, zip_code, town, zip_codes_delivering, color_code)
VALUES
  (1, 'Sunniva GmbH', 'Sam', '+496786863655', 'sam@gmail.com', 'Honer Str. 49', '37269', 'Eschwege', '30,31,34,36,37,38,98,99', '#F7941D'),
  (2, 'AdL Logistic GmbH', 'Tom', '8098075454', 'tom@gmail.com', 'Gerlinger Str. 34', '12349', 'Berlin', '10,11,12,13,14,15,16,17,39', '#1ABC9C'),
  (3, 'Frankfurt', 'Ken', '87987579', 'ken@gmail.com', 'Fokkerstr. 8', '04435', 'Schkeuditz', '01,02,03,04,05,06,07,08,09', '#2ECC71'),
  (4, 'Zahn Logistics GmbH', 'Clerk Name', '0000000000', 'zahn@example.com', 'Christof-Ruthof-Weg 7', '55252', 'Mainz-Kastel', '60,61,62,63,64,65,66,67,68,69,54,55,56,35', '#3498DB'),
  (5, 'Plischka und Schmeling', 'Clerk Name', '0000000000', 'plischka@example.com', 'Fokkerstr. 8', '04435', 'Schkeuditz', '01,02,03,04,05,06,07,08,09', '#9B59B6'),
  (6, 'ILB Transit & Logistik GmbH & Co. KG', 'Clerk Name', '0000000000', 'ilb@example.com', 'Bonifatiusstraße 391', '48432', 'Rheine', '48,49,32,33,26,27,28', '#34495E'),
  (7, 'Recht Logistik Gruppe', 'Clerk Name', '0000000000', 'recht@example.com', 'Weetfelder Str.', '59199', 'Bönen', '40,41,42,43,44,45,46,47,50,51,52,53,57,58,59', '#E74C3C'),
  (8, 'Geis Eurocargo GmbH', 'Clerk Name', '0000000000', 'geis@example.com', 'Ipsheimer Straße 19', '90431', 'Nürnberg', '90,91,92,93,94,95,96,97', '#F1C40F'),
  (9, 'LINTHER SPEDITION GmbH', 'Clerk Name', '0000000000', 'linther@example.com', 'Kronwinkler Str. 31', '81245', 'Muenchen', '80,81,82,83,84,85,86,87', '#E67E22'),
  (10, 'NL - LOGISTICS GmbH', 'Clerk Name', '0000000000', 'nl@example.com', 'Halskestraße 38', '22113', 'Hamburg', '20,21,22,23,24,25,29,18,19', '#8E44AD');
`;

export const CREATE_DRIVER_DETAILS_TABLE = `
 CREATE TABLE IF NOT EXISTS driver_details (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(45) NOT NULL,
    mob VARCHAR(20) NOT NULL,
    address VARCHAR(45) NOT NULL,
    license_plate  VARCHAR(45) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    user_id INT DEFAULT NULL,
    warehouse_id INT NOT NULL,
    overall_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse_details(warehouse_id) ON DELETE CASCADE
  );
`;

export const CREATE_VEHICLE_DETAILS_TABLE = `
    CREATE TABLE IF NOT EXISTS vehicle_details (
    vehicle_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    capacity INT  NULL DEFAULT 0,
    license_plate  VARCHAR(45)  NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    insurance_number VARCHAR(100)  NULL,
    insurance_expiry_date DATE  NULL,
    miles_driven INT  NULL DEFAULT 0,
    next_service TIMESTAMP NULL,
    warehouse_id INT  NULL,
    driver_id INT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse_details(warehouse_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver_details(id) ON DELETE CASCADE
  );
`;

export const INSERT_VEHICLE_DETAILS_DATA = `
INSERT INTO vehicle_details (license_plate, capacity, warehouse_id)
VALUES
('ABC-001', 300, 1),
('ABC-002', 1800, 2),
('ABC-003', 1800, 3),
('ABC-004', 1800, 4),
('ABC-005', 1800, 5),
('ABC-006', 1800, 6),
('ABC-007', 1800, 7),
('ABC-008', 1800, 8);
`;

export const CREATE_DRIVER_LOCATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS driver_locations (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    route_segment_id INT NOT NULL,
    comments VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tourInfo_master(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver_details(id) ON DELETE CASCADE
  );
`;

export const CREATE_TOUR_INFO_MASTER_TABLE = `
  CREATE TABLE IF NOT EXISTS tourInfo_master (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_name VARCHAR(45) NOT NULL,
    driver_id INT NOT NULL,
    tour_date DATETIME NOT NULL,
    warehouse_id INT NOT NULL,
    tour_route JSON DEFAULT NULL,
    tour_data JSON DEFAULT NULL,

    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    order_ids JSON NOT NULL,
    comments VARCHAR(255) NOT NULL,
    customer_ids VARCHAR(255) NOT NULL,
    item_total_qty_truck INT NOT NULL,
    tour_start_km INT NOT NULL,
    tour_end_km INT NOT NULL,
    excepted_tour_total_km VARCHAR(45) NOT NULL,
    
    secure_loading_photo BLOB,
    truck_loaded_photo BLOB,
    start_fuel_gauge_photo BLOB,
    start_odometer_photo BLOB,
    start_truck_exterior_photo BLOB,

    end_fuel_receipt_photo BLOB,
    end_fuel_gauge_photo BLOB,
    end_odometer_photo BLOB,
    undelivered_modules_photo BLOB,

    route_color VARCHAR(7) NOT NULL,
    hours_worked DECIMAL(5,2) DEFAULT 0.00,
    completed_early_hrs DECIMAL(5,2) DEFAULT 0.00,
    delayed_hrs DECIMAL(5,2) DEFAULT 0.00,
    notice VARCHAR(255) NOT NULL,
  
    tour_status ENUM('pending', 'live', 'confirmed', 'completed') DEFAULT 'pending',
    created_by VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(45) NULL,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    tour_total_estimate_time TIME,
    overall_performance_rating DECIMAL(2,1) DEFAULT 0.00,
    vehicle_id INT,
    CONSTRAINT fk_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle_details(vehicle_id) 
  );
`;

export const CREATE_ROUTE_UPDATES_TABLE = `
  CREATE TABLE IF NOT EXISTS route_updates (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    current_location VARCHAR(45) NOT NULL,
    customer_id VARCHAR(45) NOT NULL,
    status VARCHAR(45) NOT NULL,
    route_response VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    order_id INT NOT NULL,
    segment_id INT NOT NULL,
    FOREIGN KEY (tour_id) REFERENCES tourInfo_master(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES driver_details(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES logistic_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES route_segments(id) ON DELETE CASCADE
  );
`;

export const CREATE_API_RESPONSE_LOG_TABLE = `
  CREATE TABLE IF NOT EXISTS api_response_log (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    route_segment_id INT NOT NULL,
    api_response JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_segment_id) REFERENCES route_segments(id) ON DELETE CASCADE
  );
`;

export const CREATE_ROUTE_SEGMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS route_segments (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_id INT NOT NULL,
    route_response JSON,
    status ENUM('pending', 'in-progress', 'delivered', 'tour-completed', 'return') DEFAULT 'pending',
    doorstep_pic BLOB,
    delivered_item_pic BLOB,
    customer_signature BLOB,
    parking_place VARCHAR(255),
    neighbour_signature BLOB,
    delivered_pic_neighbour BLOB,
    order_id VARCHAR(45),
    comments VARCHAR(45) DEFAULT NULL,
    delivery_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    recipient_type ENUM('customer', 'neighbour') DEFAULT 'customer',
    FOREIGN KEY (tour_id) REFERENCES tourInfo_master(id) ON DELETE CASCADE
  );
`;
export const LOGIC_ORDER_TABLE = `
  CREATE TABLE IF NOT EXISTS logistic_order (
    order_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    shopware_order_id INT NOT NULL UNIQUE,
    order_number VARCHAR(45) NOT NULL,
    status ENUM('initial', 'unassigned', 'assigned', 'inTransit', 'delivered', 'rescheduled', 'canceled') NOT NULL DEFAULT 'initial',
    article_sku VARCHAR(255) NULL,
    tracking_code VARCHAR(100) NULL,
    order_status_id INT NULL,
    warehouse_id INT NULL,
    order_time DATETIME NULL,
    expected_delivery_time DATETIME NULL,
    payment_id INT NULL,
    invoice_amount VARCHAR(45) NULL,
    customer_id VARCHAR(45) NOT NULL,
    customer_number VARCHAR(45) NULL,
    firstname VARCHAR(45) NULL,
    lastname VARCHAR(45) NULL,
    email VARCHAR(45) NULL,
    street VARCHAR(45) NULL,
    zipcode VARCHAR(10) NULL,
    city VARCHAR(45) NULL,
    phone VARCHAR(45) NULL,
    latitude DECIMAL(10,7) NULL,
    longitude DECIMAL(10,7) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;


export const LOGIC_ORDER_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS logistic_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    slmdl_article_id VARCHAR(50) NOT NULL,
    slmdl_articleordernumber VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    warehouse_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES logistic_order(order_id) ON DELETE CASCADE,
    INDEX (order_number),
    INDEX (slmdl_articleordernumber)
  );
`;

export const LOGIC_PAYMENT_TABLE = `
  CREATE TABLE IF NOT EXISTS logistic_payment (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL
  );
`;

export const WMS_ORDER = `
  CREATE TABLE IF NOT EXISTS wms_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const WMS_ORDER_ARTICLES = `
  CREATE TABLE IF NOT EXISTS wms_order_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    wms_order_id INT NOT NULL,
    article_id INT NOT NULL,
    article_detail_id INT NOT NULL,
    article_number VARCHAR(100),
    quantity INT,
    warehouse_id INT,
    FOREIGN KEY (wms_order_id) REFERENCES wms_orders(id)
  );
`;

export const USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    user_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const TOUR_DRIVER = `
  CREATE TABLE IF NOT EXISTS tour_driver (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tour_id INT NOT NULL,
    driver_id INT NOT NULL,
    tour_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tourInfo_master(id) ON DELETE CASCADE
  );
`;

export const CREATE_SOLARMODULES_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS solarmodules_items (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    module_name VARCHAR(100) NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;

export const CREATE_WHATSAPPCHATS_TABLE = `
  CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    twilio_sid VARCHAR(255) NULL COMMENT 'Twilio Message SID for tracking',
    \`from\` VARCHAR(50) NOT NULL,
    \`to\` VARCHAR(50) NOT NULL,
    body TEXT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    message_type ENUM('text','image','video','audio' ,'document','location','contacts','sticker', 'unknown','file') DEFAULT 'text' COMMENT 'text=regular message, file/media=attachments',
    media_url TEXT NULL COMMENT 'Twilio media URL if media message',
    media_content_type VARCHAR(100) NULL COMMENT 'image/jpeg, application/pdf, etc',
    delivery_status ENUM('pending', 'queued', 'sent', 'delivered', 'read', 'failed', 'undelivered') 
      DEFAULT 'pending' 
      COMMENT 'pending=initial, queued=twilio accepted, sent=to carrier, delivered=to phone, read=user read, failed=error',
    error_code VARCHAR(50) NULL COMMENT 'Twilio error code if failed',
    error_message TEXT NULL COMMENT 'Error description if failed',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Manually marked as read by admin',
    read_at TIMESTAMP NULL COMMENT 'When manually marked as read by admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_direction (direction),
    INDEX idx_created_at (created_at),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_twilio_sid (twilio_sid),
    INDEX idx_message_type (message_type),
    CONSTRAINT fk_order_id_logistic_order
      FOREIGN KEY (order_id) REFERENCES logistic_order(order_id)
      ON DELETE CASCADE ON UPDATE CASCADE
  );
`;

export const CREATE_DYNAMIC_TOURS_TABLE = ` 
  CREATE TABLE IF NOT EXISTS dynamic_tours ( 
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,  
    tour_name VARCHAR(45) UNIQUE, 
    tour_route JSON NOT NULL, 
    tour_data JSON NOT NULL, 
    orderIds TEXT NOT NULL,  
    warehouse_id INT NOT NULL, 
    approved_by VARCHAR(45) DEFAULT NULL,  
    approved_at DATETIME DEFAULT NULL,
    updated_by VARCHAR(45) DEFAULT NULL,  
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ); 
`;

export const CREATE_TOUR_TRACES_TABLE = `
  CREATE TABLE IF NOT EXISTS tour_traces (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    source_table ENUM('dynamic_tours', 'tourinfo_master') NOT NULL,

    source_id INT NOT NULL,
    tour_name VARCHAR(100) NOT NULL,
    tour_route JSON NULL,
    tour_data JSON NULL,
    orderIds TEXT NOT NULL,
    warehouse_id INT NOT NULL,

    status ENUM('rejected', 'pending', 'live', 'confirmed', 'completed') DEFAULT NULL,
    
 
    removed_reason VARCHAR(255) DEFAULT NULL,
    removed_by VARCHAR(45) DEFAULT NULL,
    removed_at DATETIME DEFAULT CURRENT_TIMESTAMP,


    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

export const CREATE_Delivery_Cost_Per_Tour_Table = `
  CREATE TABLE IF NOT EXISTS delivery_cost_per_tour (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dynamic_tour_id INT NULL UNIQUE,
    tour_id INT NULL UNIQUE,
    total_weight_kg DECIMAL(10,2),
    total_distance_km DECIMAL(10,2),
    total_duration_hrs DECIMAL(10,2),
    delivery_cost_per_stop DECIMAL(10,2),
    delivery_cost_per_bkw DECIMAL(10,2),
    delivery_cost_per_slmd DECIMAL(10,2),
    total_cost DECIMAL(10,2) default 0,
    hotel_cost DECIMAL(10,2),
    van_tour_cost DECIMAL(10,2),
    diesel_tour_cost DECIMAL(10,2),
    personnel_tour_cost DECIMAL(10,2),
    warehouse_tour_cost DECIMAL(10,2),
    infeed_tour_cost DECIMAL(10,2),
    we_tour_cost DECIMAL(10,2),
    wa_tour_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dynamic_tour_id) REFERENCES dynamic_tours(id) ON DELETE CASCADE,
    FOREIGN KEY (tour_id) REFERENCES tourinfo_master(id) ON DELETE CASCADE
  );
`;

export const CREATE_NOTIFICATION_TABLE = `
  CREATE TABLE IF NOT EXISTS notifications_track (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    order_number VARCHAR(25) NOT NULL,
    meta_key VARCHAR(25) NOT NULL,
    meta_value VARCHAR(25) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

export const CREATE_Delivery_Cost_Rates_TABLE = `
  CREATE TABLE IF NOT EXISTS delivery_cost_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    avg_tour_duration_hrs DECIMAL(10,2),
    avg_tour_length_km DECIMAL(10,2),
    bkw_per_tour DECIMAL(10,2),
    avg_number_tour_days DECIMAL(10,2),
    personnel_costs_per_hour DECIMAL(10,2) NOT NULL,
    diesel_costs_per_liter DECIMAL(10,2) NOT NULL,
    consumption_l_per_100km DECIMAL(10,2),
    van_costs_per_day DECIMAL(10,2) NOT NULL,
    storage_cost_per_BKW DECIMAL(10,2),
    currency_code enum('EUR', 'USD') DEFAULT 'EUR',
    handling_inbound_cost_tour DECIMAL(10,2),
    handling_inbound_cost_panel DECIMAL(10,2),
    handling_outbound_cost_pal DECIMAL(10,2),
    handling_outbound_costs_tour DECIMAL(10,2),
    hotel_costs DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

export const INSERT_Delivery_Cost_Rates_TABLE = `
INSERT INTO delivery_cost_rates (
    avg_tour_duration_hrs,
    avg_tour_length_km,
    bkw_per_tour,
    avg_number_tour_days,
    personnel_costs_per_hour,
    diesel_costs_per_liter,
    consumption_l_per_100km,
    van_costs_per_day,
    hotel_costs,
    created_at,
    handling_inbound_cost_tour,
    handling_inbound_cost_panel,
    handling_outbound_cost_pal,
    handling_outbound_costs_tour,
    storage_cost_per_BKW,
    currency_code
)
VALUES (
    9.25, 367, 16, 2, 18.18, 1.38, 10, 18.91, 65, NOW(),
    NULL, 0.05, NULL, NULL, NULL, 'EUR'
);
`;

export const CREATE_ORDER_IMAGES_TABLE = `
  CREATE TABLE IF NOT EXISTS order_images (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    tour_id VARCHAR(25) NOT NULL,
    order_id VARCHAR(25) NOT NULL,
    order_number VARCHAR(25) NOT NULL,
    route_segment_id INT NOT NULL,
    type ENUM('customer_door_step', 'customer_delivered_item', 'customer_delivered_item_modal', 'customer_signature','neighbour_door_step', 'neighbour_delivered_item', 'neighbour_delivered_item_modal', 'neighbour_signature', 'damaged') NOT NULL DEFAULT 'customer_door_step',
    image VARCHAR(999) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_segment_id) REFERENCES route_segments(id) ON DELETE CASCADE
  );
`;

export const CREATE_CANCELS_ORDER_TABLE = `
  CREATE TABLE IF NOT EXISTS cancels_order (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT DEFAULT NULL,
    shopware_order_id INT DEFAULT NULL,
    order_number VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    invoice_amount VARCHAR(50) DEFAULT NULL,
    payment_id INT DEFAULT NULL,
    warehouse_id INT DEFAULT NULL,
    order_time DATETIME DEFAULT NULL,
    expected_delivery_time DATETIME DEFAULT NULL,
    customer_number VARCHAR(50) DEFAULT NULL,
    firstname VARCHAR(50) DEFAULT NULL,
    lastname VARCHAR(50) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    street VARCHAR(100) DEFAULT NULL,
    zipcode VARCHAR(20) DEFAULT NULL,
    city VARCHAR(50) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    latitude DECIMAL(10,7) DEFAULT NULL,
    longitude DECIMAL(10,7) DEFAULT NULL,
    status ENUM('initial', 'unassigned', 'assigned', 'inTransit', 'delivered', 'rescheduled', 'canceled') DEFAULT 'initial',
    article_sku	 VARCHAR(255) DEFAULT NULL,
    tracking_code VARCHAR(100) DEFAULT NULL,
    order_status_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;

export const CREATE_CANCELS_ORDER_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS cancels_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancel_id INT NOT NULL,
    article_sku VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    cancel_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;
