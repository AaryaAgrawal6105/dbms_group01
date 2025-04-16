-- Create Staff table
CREATE TABLE Staff (
    Staff_id INT PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Full_name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(15),
    Role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Last_login TIMESTAMP NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO Staff (Username, Password, Full_name, Email, Role)
VALUES ('admin', '$2b$10$LPUigdTwMqQ1vJ2XTzh4UOQ9NLTms3IxLwEw9/XUBGBfcUY0YmQPe', 'Admin User', 'admin@jewellery.com', 'admin');
