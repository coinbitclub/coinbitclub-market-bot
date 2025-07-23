const { query } = require('./db');
const bcrypt = require('bcrypt');

class UsersController {
  // Get all users with financial data and affiliates
  async getAllUsers(req, res) {
    try {
      const userQuery = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.status,
          u.is_affiliate,
          u.created_at,
          u.last_login_at,
          u.email_verified_at,
          uf.balance,
          uf.profit,
          uf.locked,
          p.name as plan_name,
          COUNT(o.id) as total_operations,
          COALESCE(SUM(o.profit_usd), 0) as total_profit_usd
        FROM users u
        LEFT JOIN user_financial uf ON uf.user_id = u.id
        LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
        LEFT JOIN plans p ON p.id = s.plan_id
        LEFT JOIN operations o ON o.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.role, u.status, u.is_affiliate, 
                 u.created_at, u.last_login_at, u.email_verified_at,
                 uf.balance, uf.profit, uf.locked, p.name
        ORDER BY u.created_at DESC
      `;
      
      const users = await query(userQuery);
      
      res.json({
        success: true,
        data: users,
        total: users.length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch users' 
      });
    }
  }

  // Get user by ID with detailed information
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const userQuery = `
        SELECT 
          u.*,
          uf.balance,
          uf.profit,
          uf.locked,
          p.name as plan_name,
          s.status as subscription_status,
          s.started_at as subscription_started,
          s.ends_at as subscription_ends
        FROM users u
        LEFT JOIN user_financial uf ON uf.user_id = u.id
        LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
        LEFT JOIN plans p ON p.id = s.plan_id
        WHERE u.id = $1
      `;
      
      const users = await query(userQuery, [id]);
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Get user operations
      const operationsQuery = `
        SELECT * FROM operations 
        WHERE user_id = $1 
        ORDER BY closed_at DESC 
        LIMIT 10
      `;
      
      const operations = await query(operationsQuery, [id]);
      
      // Get user credentials
      const credentialsQuery = `
        SELECT exchange, is_testnet, created_at 
        FROM user_credentials 
        WHERE user_id = $1
      `;
      
      const credentials = await query(credentialsQuery, [id]);
      
      const userData = {
        ...users[0],
        recent_operations: operations,
        credentials: credentials
      };
      
      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user' 
      });
    }
  }

  // Create new user
  async createUser(req, res) {
    try {
      const { name, email, password, role = 'user', is_affiliate = false } = req.body;
      
      // Check if email already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userQuery = `
        INSERT INTO users (name, email, password, password_hash, role, is_affiliate)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, email, role, is_affiliate, created_at
      `;
      
      const newUsers = await query(userQuery, [
        name, email, hashedPassword, hashedPassword, role, is_affiliate
      ]);
      
      const userId = newUsers[0].id;
      
      // Create user financial record
      await query(
        'INSERT INTO user_financial (user_id) VALUES ($1)',
        [userId]
      );
      
      // Create user settings
      await query(
        'INSERT INTO user_settings (user_id) VALUES ($1)',
        [userId]
      );
      
      res.status(201).json({
        success: true,
        data: newUsers[0]
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create user' 
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, status, is_affiliate } = req.body;
      
      const updateQuery = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, is_affiliate = $5, updated_at = NOW()
        WHERE id = $6
        RETURNING id, name, email, role, status, is_affiliate, updated_at
      `;
      
      const updatedUsers = await query(updateQuery, [
        name, email, role, status, is_affiliate, id
      ]);
      
      if (updatedUsers.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: updatedUsers[0]
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update user' 
      });
    }
  }

  // Update user financial data
  async updateUserFinancial(req, res) {
    try {
      const { id } = req.params;
      const { balance, profit, locked } = req.body;
      
      const updateQuery = `
        UPDATE user_financial 
        SET balance = $1, profit = $2, locked = $3, updated_at = NOW()
        WHERE user_id = $4
        RETURNING *
      `;
      
      const updated = await query(updateQuery, [balance, profit, locked, id]);
      
      if (updated.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User financial record not found'
        });
      }
      
      res.json({
        success: true,
        data: updated[0]
      });
    } catch (error) {
      console.error('Error updating user financial:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update user financial data' 
      });
    }
  }

  // Delete user (soft delete by changing status)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const deleteQuery = `
        UPDATE users 
        SET status = 'inactive', updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, status
      `;
      
      const deletedUsers = await query(deleteQuery, [id]);
      
      if (deletedUsers.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: deletedUsers[0]
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete user' 
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN status = 'trial_active' THEN 1 END) as trial_users,
          COUNT(CASE WHEN is_affiliate = true THEN 1 END) as affiliates,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
        FROM users
      `;
      
      const stats = await query(statsQuery);
      
      res.json({
        success: true,
        data: stats[0]
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch user statistics' 
      });
    }
  }
}

module.exports = new UsersController();
