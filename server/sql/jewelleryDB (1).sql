
CREATE TABLE Customer (
    Cust_id INT PRIMARY KEY,
    Cust_name VARCHAR(100) NOT NULL,
    Phone_no VARCHAR(15) UNIQUE NOT NULL,
    Email VARCHAR(100) UNIQUE
);

-- Creating Order Table
CREATE TABLE Orders (
    Order_id INT PRIMARY KEY,
    Cust_id INT,
    Order_date DATE NOT NULL,
    Total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (Cust_id) REFERENCES Customer(Cust_id)
);

-- Creating Jewellery Table
CREATE TABLE Jewellery (
    Jewellery_id INT PRIMARY KEY,
    Type VARCHAR(50) NOT NULL,
    Description VARCHAR(255),
    HSN VARCHAR(20) NOT NULL,
    Quantity INT NOT NULL
);

-- Creating Order Details Table for Aggregation (Many-to-Many)
CREATE TABLE Order_Details (
    Order_id INT,
    Jewellery_id INT,
    Quantity INT NOT NULL,
    Date DATE NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (Order_id, Jewellery_id),
    FOREIGN KEY (Order_id) REFERENCES Orders(Order_id),
    FOREIGN KEY (Jewellery_id) REFERENCES Jewellery(Jewellery_id)
);

-- Creating Linked Stock Table (Aggregation)
CREATE TABLE Linked_Stock (
    Jewellery_id INT,
    Model_No VARCHAR(50),
    Unit_id INT,
    Weight DECIMAL(10,2) NOT NULL,
    Size VARCHAR(20),
    Status VARCHAR(20) CHECK (Status IN ('Available', 'Sold')),
    Sold_at DECIMAL(10,2),
    PRIMARY KEY (Jewellery_id, Model_No, Unit_id),
    FOREIGN KEY (Jewellery_id) REFERENCES Jewellery(Jewellery_id)
);

-- Creating Payment Table
CREATE TABLE Payment (
    Payment_id INT PRIMARY KEY,
    Order_id INT UNIQUE,
    Payment_mode VARCHAR(50) CHECK (Payment_mode IN ('Cash', 'Card', 'UPI')),
    Amount DECIMAL(10,2) NOT NULL,
    Payment_date DATE NOT NULL,
    Payment_time TIME NOT NULL,
    FOREIGN KEY (Order_id) REFERENCES Orders(Order_id)
);

-- Inserting Data into Customer Table
INSERT INTO Customer VALUES
(1, 'John Doe', '1234567890', 'johndoe@example.com'),
(2, 'Jane Smith', '1234567891', 'janesmith@example.com'),
(3, 'Emily Davis', '1234567892', 'emilydavis@example.com'),
(4, 'Michael Brown', '1234567893', 'michaelbrown@example.com'),
(5, 'Sarah Wilson', '1234567894', 'sarahwilson@example.com'),
(6, 'David Miller', '1234567895', 'davidmiller@example.com'),
(7, 'Jessica Taylor', '1234567896', 'jessicataylor@example.com'),
(8, 'Daniel Anderson', '1234567897', 'danielanderson@example.com'),
(9, 'Matthew Thomas', '1234567898', 'matthewthomas@example.com'),
(10, 'Ashley White', '1234567899', 'ashleywhite@example.com');

-- Inserting Data into Orders Table
INSERT INTO Orders VALUES
(1, 1, '2025-03-01', 500.00),
(2, 2, '2025-03-02', 1500.00),
(3, 3, '2025-03-03', 2000.00),
(4, 4, '2025-03-04', 750.00),
(5, 5, '2025-03-05', 900.00),
(6, 6, '2025-03-06', 1200.00),
(7, 7, '2025-03-07', 3000.00),
(8, 8, '2025-03-08', 800.00),
(9, 9, '2025-03-09', 400.00),
(10, 10, '2025-03-10', 600.00);

-- Inserting Data into Jewellery Table
INSERT INTO Jewellery VALUES
(1, 'Ring', 'Gold Ring', 'HSN001', 10),
(2, 'Necklace', 'Diamond Necklace', 'HSN002', 5),
(3, 'Bracelet', 'Silver Bracelet', 'HSN003', 8),
(4, 'Earrings', 'Platinum Earrings', 'HSN004', 12),
(5, 'Pendant', 'Ruby Pendant', 'HSN005', 6),
(6, 'Bangle', 'Gold Bangle', 'HSN006', 9),
(7, 'Brooch', 'Emerald Brooch', 'HSN007', 4),
(8, 'Chain', 'Silver Chain', 'HSN008', 15),
(9, 'Anklet', 'Gold Anklet', 'HSN009', 7),
(10, 'Tiara', 'Diamond Tiara', 'HSN010', 3);

-- Inserting Data into Payment Table
INSERT INTO Payment VALUES
(1, 1, 'Card', 500.00, '2025-03-01', '10:00:00'),
(2, 2, 'UPI', 1500.00, '2025-03-02', '11:30:00'),
(3, 3, 'Cash', 2000.00, '2025-03-03', '13:00:00'),
(4, 4, 'Card', 750.00, '2025-03-04', '14:15:00'),
(5, 5, 'UPI', 900.00, '2025-03-05', '15:45:00'),
(6, 6, 'Cash', 1200.00, '2025-03-06', '16:30:00'),
(7, 7, 'Card', 3000.00, '2025-03-07', '17:00:00'),
(8, 8, 'UPI', 800.00, '2025-03-08', '18:20:00'),
(9, 9, 'Cash', 400.00, '2025-03-09', '19:10:00'),
(10, 10, 'Card', 600.00, '2025-03-10', '20:00:00');

-- 1. IN Procedure: Add a new customer
DELIMITER $$
CREATE PROCEDURE AddCustomer(
    IN p_Cust_id INT,
    IN p_Cust_name VARCHAR(100),
    IN p_Phone_no VARCHAR(15),
    IN p_Email VARCHAR(100)
)
BEGIN
    INSERT INTO Customer (Cust_id, Cust_name, Phone_no, Email)
    VALUES (p_Cust_id, p_Cust_name, p_Phone_no, p_Email);
END$$
DELIMITER ;

-- 2. IN Procedure: Add a new order
DELIMITER $$
CREATE PROCEDURE AddOrder(
    IN p_Order_id INT,
    IN p_Cust_id INT,
    IN p_Order_date DATE,
    IN p_Total_price DECIMAL(10,2)
)
BEGIN
    INSERT INTO Orders (Order_id, Cust_id, Order_date, Total_price)
    VALUES (p_Order_id, p_Cust_id, p_Order_date, p_Total_price);
END$$
DELIMITER ;

-- 3. OUT Procedure: Get total sales for a specific date
DELIMITER $$
CREATE PROCEDURE GetTotalSales(
    IN p_Date DATE,
    OUT p_TotalSales DECIMAL(10,2)
)
BEGIN
    SELECT SUM(Total_price) INTO p_TotalSales
    FROM Orders
    WHERE Order_date = p_Date;
END$$
DELIMITER ;

-- 4. OUT Procedure: Get available stock for a given jewellery item
DELIMITER $$
CREATE PROCEDURE GetJewelleryStock(
    IN p_Jewellery_id INT,
    OUT p_AvailableStock INT
)
BEGIN
    SELECT Quantity INTO p_AvailableStock
    FROM Jewellery
    WHERE Jewellery_id = p_Jewellery_id;
END$$
DELIMITER ;

-- 5. INOUT Procedure: Apply a discount to an order.
-- Input discount percentage; the procedure updates the order's total price and returns the new total price via the same parameter.
DELIMITER $$
CREATE PROCEDURE ApplyDiscountToOrder(
    IN p_Order_id INT,
    INOUT p_DiscountPercent DECIMAL(5,2)
)
BEGIN
    DECLARE v_Total DECIMAL(10,2);
    SELECT Total_price INTO v_Total
    FROM Orders
    WHERE Order_id = p_Order_id;
    
    -- Calculate new total after discount
    SET v_Total = v_Total - (v_Total * p_DiscountPercent/100);
    UPDATE Orders
    SET Total_price = v_Total
    WHERE Order_id = p_Order_id;
    
    -- Return the new total price in the INOUT parameter
    SET p_DiscountPercent = v_Total;
END$$
DELIMITER ;

-- 6. INOUT Procedure: Update the status of a linked stock unit.
-- The INOUT parameter p_Status is used to pass in the new status and then return the updated status.
DELIMITER $$
CREATE PROCEDURE UpdateLinkedStockStatus(
    IN p_Jewellery_id INT,
    IN p_Model_No VARCHAR(50),
    IN p_Unit_id INT,
    INOUT p_Status VARCHAR(20)
)
BEGIN
    UPDATE Linked_Stock
    SET Status = p_Status
    WHERE Jewellery_id = p_Jewellery_id
      AND Model_No = p_Model_No
      AND Unit_id = p_Unit_id;
      
    SELECT Status INTO p_Status
    FROM Linked_Stock
    WHERE Jewellery_id = p_Jewellery_id
      AND Model_No = p_Model_No
      AND Unit_id = p_Unit_id;
END$$
DELIMITER ;

-- 1. View: Customer Orders
CREATE VIEW vw_customer_orders AS
SELECT c.Cust_id, c.Cust_name, o.Order_id, o.Order_date, o.Total_price
FROM Customer c
JOIN Orders o ON c.Cust_id = o.Cust_id;

-- 2. View: Jewellery Stock Details
CREATE VIEW vw_jewellery_stock AS
SELECT j.Jewellery_id, j.Type, j.Description, j.Quantity AS Total_Jewellery,
       ls.Model_No, ls.Unit_id, ls.Weight, ls.Size, ls.Status, ls.Sold_at
FROM Jewellery j
LEFT JOIN Linked_Stock ls ON j.Jewellery_id = ls.Jewellery_id;

-- 3. View: Order Payment Summary
CREATE VIEW vw_order_payment_summary AS
SELECT o.Order_id, o.Order_date, o.Total_price, p.Payment_mode, p.Amount AS Payment_Amount,
       p.Payment_date, p.Payment_time
FROM Orders o
JOIN Payment p ON o.Order_id = p.Order_id;

-- 4. View: Total Sales by Date
CREATE VIEW vw_total_sales_by_date AS
SELECT Order_date, SUM(Total_price) AS Total_Sales
FROM Orders
GROUP BY Order_date;

-- 5. View: Full Order Details
CREATE VIEW vw_order_details_full AS
SELECT c.Cust_id, c.Cust_name, o.Order_id, o.Order_date, o.Total_price,
       od.Jewellery_id, od.Quantity, od.Date AS Order_Detail_Date, od.Amount
FROM Customer c
JOIN Orders o ON c.Cust_id = o.Cust_id
JOIN Order_Details od ON o.Order_id = od.Order_id;

-- 6. View: Available Jewellery in Stock
CREATE VIEW vw_available_jewellery AS
SELECT j.Jewellery_id, j.Type, j.Description, ls.Model_No, ls.Unit_id, ls.Weight, ls.Size
FROM Jewellery j
JOIN Linked_Stock ls ON j.Jewellery_id = ls.Jewellery_id
WHERE ls.Status = 'Available';

-- Materialized View 1: Total Sales by Date
DROP TABLE IF EXISTS mv_total_sales_by_date;
CREATE TABLE mv_total_sales_by_date AS
SELECT Order_date, SUM(Total_price) AS Total_Sales
FROM Orders
GROUP BY Order_date;

DELIMITER $$
CREATE PROCEDURE Refresh_mv_total_sales_by_date()
BEGIN
    TRUNCATE TABLE mv_total_sales_by_date;
    INSERT INTO mv_total_sales_by_date
    SELECT Order_date, SUM(Total_price) AS Total_Sales
    FROM Orders
    GROUP BY Order_date;
END$$
DELIMITER ;

-- Materialized View 2: Available Jewellery in Stock
DROP TABLE IF EXISTS mv_available_jewellery;
CREATE TABLE mv_available_jewellery AS
SELECT j.Jewellery_id, j.Type, j.Description, ls.Model_No, ls.Unit_id, ls.Weight, ls.Size
FROM Jewellery j
JOIN Linked_Stock ls ON j.Jewellery_id = ls.Jewellery_id
WHERE ls.Status = 'Available';

DELIMITER $$
CREATE PROCEDURE Refresh_mv_available_jewellery()
BEGIN
    TRUNCATE TABLE mv_available_jewellery;
    INSERT INTO mv_available_jewellery
    SELECT j.Jewellery_id, j.Type, j.Description, ls.Model_No, ls.Unit_id, ls.Weight, ls.Size
    FROM Jewellery j
    JOIN Linked_Stock ls ON j.Jewellery_id = ls.Jewellery_id
    WHERE ls.Status = 'Available';
END$$
DELIMITER ;
