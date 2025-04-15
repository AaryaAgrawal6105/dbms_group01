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
        totalSales: salesData.reduce((acc, curr) => acc + curr.total_sales, 0)
      });
    } catch (error) {
      console.error('Error in getSalesByDate:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get available jewellery
  getAvailablejewellery: async (req, res) => {
    try {
      // Use the view for available jewellery that we defined in the SQL file
      const [rows] = await pool.query(`
        SELECT * FROM vw_available_jewellery
      `);

      const [totalCount] = await pool.query(`
        SELECT COUNT(*) as count
        FROM vw_available_jewellery
      `);

      res.json({
        items: rows,
        count: totalCount[0].count
      });
    } catch (error) {
      console.error('Error in getAvailablejewellery:', error);
      res.status(500).json({ error: error.message });
    }
  }
};