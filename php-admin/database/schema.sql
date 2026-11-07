CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT UNSIGNED PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_categories (
    name VARCHAR(64) PRIMARY KEY,
    sort_order INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    category VARCHAR(64) NOT NULL,
    price INT UNSIGNED NULL,
    image VARCHAR(200) NOT NULL,
    non_coffee TINYINT(1) NOT NULL DEFAULT 0,
    description TEXT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    is_sold_out TINYINT(1) NOT NULL DEFAULT 0,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    featured_rank INT UNSIGNED NOT NULL DEFAULT 0,
    version INT UNSIGNED NOT NULL DEFAULT 1,
    deleted_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_menu_category FOREIGN KEY (category) REFERENCES menu_categories(name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(40) NOT NULL UNIQUE,
    request_key VARCHAR(64) NOT NULL UNIQUE,
    request_hash CHAR(64) NOT NULL,
    customer_name VARCHAR(80) NOT NULL,
    customer_phone VARCHAR(16) NOT NULL,
    customer_email VARCHAR(254) NOT NULL DEFAULT '',
    note VARCHAR(300) NOT NULL DEFAULT '',
    fulfilment VARCHAR(16) NOT NULL DEFAULT 'pickup',
    payment_method VARCHAR(16) NULL,
    total INT UNSIGNED NOT NULL,
    status ENUM('Pending','Processing','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    version INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX orders_created (created_at),
    INDEX orders_status (status),
    INDEX orders_customer (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id VARCHAR(80) NOT NULL,
    product_name VARCHAR(80) NOT NULL,
    category VARCHAR(64) NOT NULL,
    image VARCHAR(200) NOT NULL,
    size_label VARCHAR(40) NOT NULL,
    addons_json TEXT NOT NULL,
    qty SMALLINT UNSIGNED NOT NULL,
    unit_price INT UNSIGNED NOT NULL,
    CONSTRAINT fk_line_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    from_status VARCHAR(16) NULL,
    to_status VARCHAR(16) NOT NULL,
    admin_id VARCHAR(32) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
