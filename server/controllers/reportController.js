import pool from '../config/database.js';

export const reportController = {
  // Get sales by date
  getSalesByDate: async (req, res) => {
    try {
      const [salesData] = await pool.query(`
        SELECT 
          DATE(Order_date) as date,
          COUNT(*) as order_count,
          SUM(Total_price) as total_sales
        FROM Orders
        GROUP BY DATE(Order_date)
        ORDER BY date DESC
        LIMIT 7
      `);

      const [todayOrders] = await pool.query(`
        SELECT COUNT(*) as count
        FROM Orders
        WHERE DATE(Order_date) = CURDATE()
      `);

      const [pendingpayment] = await pool.query(`
        SELECT SUM(o.Total_price - COALESCE(p.Amount, 0)) as pending
        FROM Orders o
        LEFT JOIN payment p ON o.Order_id = p.Order_id
        WHERE p.Payment_id IS NULL OR p.Amount < o.Total_price
      `);

      res.json({
        recentSales: salesData,
        todayOrders: todayOrders[0].count,
        pendingpayment: pendingpayment[0].pending || 0,
        totalSales: salesData.reduce((acc, curr) => acc + Number(curr.total_sales), 0)
      });
    } catch (error) {
      console.error('Error in getSalesByDate:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get available jewellery
  getAvailablejewellery: async (req, res) => {
    try {
      // Get all jewellery with quantity
      const [jewelleryRows] = await pool.query(`
        SELECT j.Jewellery_id, j.Type, j.Description, j.Quantity
        FROM Jewellery j
        ORDER BY j.Type
      `);

      // Get stock status counts
      const [stockStatusCounts] = await pool.query(`
        SELECT Status, COUNT(*) as count
        FROM Linked_Stock
        GROUP BY Status
      `);

      // Get detailed stock information
      const [stockDetails] = await pool.query(`
        SELECT ls.Jewellery_id, j.Type, j.Description, ls.Model_No, ls.Unit_id, ls.Weight, ls.Size, ls.Status, ls.Quantity
        FROM Linked_Stock ls
        JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id
        ORDER BY ls.Status, j.Type
      `);

      const [totalCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Jewellery
      `);

      const [totalStockCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Linked_Stock
      `);

      const [availableStockCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Linked_Stock WHERE Status = 'Available' AND Quantity > 0
      `);

      res.json({
        jewellery: jewelleryRows,
        stockStatusCounts: stockStatusCounts,
        stockDetails: stockDetails,
        totalCount: totalCount[0].count,
        totalStockCount: totalStockCount[0].count,
        availableStockCount: availableStockCount[0].count
      });
    } catch (error) {
      console.error('Error in getAvailablejewellery:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get dashboard data
  getDashboardData: async (req, res) => {
    try {
      // Get customer count
      const [customerCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Customer
      `);
      
      // Get order count
      const [orderCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Orders
      `);
      
      // Get total sales
      const [totalSales] = await pool.query(`
        SELECT SUM(Total_price) as total FROM Orders
      `);
      
      // Get stock count
      const [stockCount] = await pool.query(`
        SELECT COUNT(*) as count FROM Linked_Stock
      `);
      
      // Get recent orders
      const [recentOrders] = await pool.query(`
        SELECT o.Order_id, o.Order_date, o.Total_price, c.Cust_name, p.Payment_id
        FROM Orders o
        JOIN Customer c ON o.Cust_id = c.Cust_id
        LEFT JOIN Payment p ON o.Order_id = p.Order_id
        ORDER BY o.Order_date DESC
        LIMIT 5
      `);
      
      res.json({
        customerCount: customerCount[0].count,
        orderCount: orderCount[0].count,
        totalSales: Number(totalSales[0].total) || 0,
        stockCount: stockCount[0].count,
        recentOrders
      });
    } catch (error) {
      console.error('Error in getDashboardData:', error);
      res.status(500).json({ error: error.message });
    }
  }
};