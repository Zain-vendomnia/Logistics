export const CREATE_DRIVER_DETAILS_TABLE = `
 CREATE TABLE IF NOT EXISTS driver_details (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(45) NOT NULL,
    mob VARCHAR(20) NOT NULL,
    address VARCHAR(45) NOT NULL,
    licenceplate VARCHAR(45) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    user_id INT DEFAULT NULL,
    warehouse_id INT NOT NULL,
    overall_rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouse_details(warehouse_id) ON DELETE CASCADE,
);

`;

export const CREATE_DRIVER_LOCATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS driver_locations (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
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
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    order_ids JSON NOT NULL,
    comments VARCHAR(255) NOT NULL,
    customer_ids VARCHAR(255) NOT NULL,
    item_total_qty_truck INT NOT NULL,
    tour_start_km INT NOT NULL,
    tour_end_km INT NOT NULL,
    tour_total_km VARCHAR(45) NOT NULL,
    
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
    graphhopper_route JSON,
    tour_status ENUM('pending', 'live', 'confirmed', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;

export const CREATE_ROUTE_UPDATES_TABLE = `
  CREATE TABLE IF NOT EXISTS route_updates (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    tour_id INT NOT NULL,
    driver_id INT NOT NULL,
    latitude VARCHAR(45) NOT NULL,
    longitude VARCHAR(45) NOT NULL,
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
    delivery_time TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tourInfo_master(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    recipient_type ENUM('customer', 'neighbour') DEFAULT 'customer'
  );
`;

export const CREATE_WAREHOUSE_DETAILS_TABLE = `
  CREATE TABLE IF NOT EXISTS warehouse_details (
    warehouse_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    warehouse_name VARCHAR(45) NOT NULL,
    clerk_name VARCHAR(45) NOT NULL,
    clerk_mob VARCHAR(20) NOT NULL,
    address VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
  );
`;

export const LOGIC_ORDER_TABLE = `
  CREATE TABLE IF NOT EXISTS logistic_order (
    order_id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(45) NOT NULL,
    customer_id VARCHAR(45) NOT NULL,
    invoice_amount VARCHAR(45) NOT NULL,
    payment_id INT NOT NULL,
    warehouse_id INT NOT NULL,
    order_time DATETIME NOT NULL,
    expected_delivery_time DATETIME NOT NULL,
    customer_number VARCHAR(45) NOT NULL,
    firstname VARCHAR(45) NOT NULL,
    lastname VARCHAR(45) NOT NULL,
    email VARCHAR(45) NOT NULL,
    street VARCHAR(45) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    city VARCHAR(45) NOT NULL,
    phone VARCHAR(45) NOT NULL,
    lattitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
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
