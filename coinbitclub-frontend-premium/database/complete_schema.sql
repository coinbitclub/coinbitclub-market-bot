-- CoinBitClub Market Bot - Complete Database Schema
-- PostgreSQL Database Structure - Updated Version

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (updated with new fields)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    cpf VARCHAR(20), -- Required for Brazilian users for withdrawals
    bank_name VARCHAR(255),
    bank_branch VARCHAR(20),
    bank_account VARCHAR(50),
    plan_type VARCHAR(50) DEFAULT 'prepaid', -- 'monthly' or 'prepaid'
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User financial balances
CREATE TABLE user_balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    prepaid_balance DECIMAL(15,2) DEFAULT 0, -- Pre-paid balance in USD
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    pending_commission DECIMAL(15,2) DEFAULT 0, -- Commission pending to pay
    paid_commission DECIMAL(15,2) DEFAULT 0, -- Commission already paid
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User trading settings
CREATE TABLE user_trading_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    max_leverage INTEGER DEFAULT 10,
    max_stop_loss DECIMAL(5,2) DEFAULT 5.0, -- Percentage
    max_percent_per_trade DECIMAL(5,2) DEFAULT 2.0, -- Percentage of balance per trade
    binance_api_key TEXT,
    binance_api_secret TEXT,
    bybit_api_key TEXT,
    bybit_api_secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- 'monthly' or 'prepaid'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'expired'
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    starts_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP,
    canceled_at TIMESTAMP,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    type VARCHAR(50) DEFAULT 'subscription', -- 'subscription', 'prepaid_balance'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'disputed'
    stripe_payment_intent_id VARCHAR(255),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Trading operations
CREATE TABLE trade_operations (
    to_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exchange VARCHAR(20) NOT NULL, -- 'binance' or 'bybit'
    symbol VARCHAR(20) NOT NULL, -- e.g., 'BTCUSDT'
    type VARCHAR(10) NOT NULL, -- 'LONG' or 'SHORT'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'cancelled'
    entry_price DECIMAL(15,8) NOT NULL,
    exit_price DECIMAL(15,8),
    quantity DECIMAL(15,8) NOT NULL,
    leverage INTEGER NOT NULL,
    stop_loss DECIMAL(15,8) NOT NULL,
    take_profit DECIMAL(15,8),
    result DECIMAL(15,2), -- Profit/Loss in USD
    result_percentage DECIMAL(5,2), -- Percentage return
    commission DECIMAL(15,2) DEFAULT 0,
    fees DECIMAL(15,2) DEFAULT 0,
    ai_justification TEXT, -- AI explanation for negative results
    opened_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Reports (RADAR DA ÁGUIA NEWS)
CREATE TABLE ai_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    market_scenario VARCHAR(50) NOT NULL, -- 'alta', 'baixa', 'lateralizacao_alta_volatilidade', etc.
    main_news JSONB, -- Array of main news items
    holidays JSONB, -- {china: "", usa: ""}
    potential_impact JSONB, -- Array of impact points
    trend VARCHAR(200),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliates table
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affiliate_code VARCHAR(20) UNIQUE NOT NULL,
    referral_code VARCHAR(20), -- Code used by this user when signing up
    commission_rate DECIMAL(5,4) DEFAULT 0.0150, -- 1.5% default
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'
    total_referrals INTEGER DEFAULT 0,
    total_earnings DECIMAL(15,2) DEFAULT 0,
    pending_payout DECIMAL(15,2) DEFAULT 0,
    paid_out DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Affiliate commissions
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_operation_id UUID REFERENCES trade_operations(to_id),
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,4) NOT NULL,
    type VARCHAR(20) DEFAULT 'trade', -- 'trade', 'subscription'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid'
    user_profit DECIMAL(15,2), -- Profit made by the referred user
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Prepaid balance withdrawals
CREATE TABLE prepaid_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'processed', 'rejected'
    bank_details JSONB, -- Bank information for the withdrawal
    admin_notes TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for broadcast
    type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'push', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    target_users JSONB, -- Array of user IDs for targeted notifications
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs for admin actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_trade_operations_user_id ON trade_operations(user_id);
CREATE INDEX idx_trade_operations_status ON trade_operations(status);
CREATE INDEX idx_trade_operations_opened_at ON trade_operations(opened_at);
CREATE INDEX idx_trade_operations_closed_at ON trade_operations(closed_at);
CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_affiliate_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX idx_commissions_affiliate_id ON commissions(affiliate_id);
CREATE INDEX idx_commissions_referred_user_id ON commissions(referred_user_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_ai_reports_published_at ON ai_reports(published_at);
CREATE INDEX idx_prepaid_withdrawals_user_id ON prepaid_withdrawals(user_id);
CREATE INDEX idx_prepaid_withdrawals_status ON prepaid_withdrawals(status);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_trading_settings_updated_at BEFORE UPDATE ON user_trading_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_operations_updated_at BEFORE UPDATE ON trade_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_reports_updated_at BEFORE UPDATE ON ai_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commissions_updated_at BEFORE UPDATE ON commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prepaid_withdrawals_updated_at BEFORE UPDATE ON prepaid_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('maintenance_mode', 'false', 'System maintenance mode'),
('registration_enabled', 'true', 'Allow new user registrations'),
('trial_duration_days', '7', 'Trial period duration in days'),
('default_commission_rate', '0.015', 'Default affiliate commission rate (1.5%)'),
('max_signals_per_day', '50', 'Maximum trading signals per day'),
('email_notifications_enabled', 'true', 'Enable email notifications'),
('sms_notifications_enabled', 'false', 'Enable SMS notifications'),
('backup_retention_days', '90', 'Database backup retention period'),
('session_timeout_minutes', '60', 'User session timeout in minutes'),
('min_withdrawal_amount', '50', 'Minimum withdrawal amount in USD'),
('max_concurrent_trades', '2', 'Maximum concurrent trades per user'),
('payout_min_days_interval', '20', 'Minimum days between withdrawal requests');

-- Create function to generate affiliate codes
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS VARCHAR(20) AS $$
DECLARE
    code VARCHAR(20);
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate a random 8-character code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT COUNT(*) INTO exists_check FROM affiliates WHERE affiliate_code = code;
        
        -- If code doesn't exist, return it
        IF exists_check = 0 THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create affiliate record when user signs up
CREATE OR REPLACE FUNCTION create_affiliate_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Create affiliate record for new user
    INSERT INTO affiliates (user_id, affiliate_code, referral_code)
    VALUES (
        NEW.id,
        generate_affiliate_code(),
        NULL -- Will be updated if user used a referral code
    );
    
    -- Create user balance record
    INSERT INTO user_balances (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create affiliate record on user creation
CREATE TRIGGER create_affiliate_on_user_creation_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_affiliate_on_user_creation();

-- Create function to calculate and award affiliate commissions
CREATE OR REPLACE FUNCTION award_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
    affiliate_record RECORD;
    commission_amount DECIMAL(15,2);
BEGIN
    -- Only process closed profitable trades
    IF NEW.status = 'closed' AND NEW.result > 0 THEN
        -- Find the affiliate who referred this user
        SELECT a.* INTO affiliate_record
        FROM affiliates a
        JOIN affiliates ua ON ua.user_id = NEW.user_id
        WHERE a.affiliate_code = ua.referral_code
        AND a.status = 'active';
        
        IF FOUND THEN
            -- Calculate 1.5% commission on user's profit
            commission_amount := NEW.result * affiliate_record.commission_rate;
            
            -- Create commission record
            INSERT INTO commissions (
                affiliate_id,
                referred_user_id,
                trade_operation_id,
                amount,
                percentage,
                type,
                user_profit
            ) VALUES (
                affiliate_record.id,
                NEW.user_id,
                NEW.to_id,
                commission_amount,
                affiliate_record.commission_rate,
                'trade',
                NEW.result
            );
            
            -- Update affiliate earnings
            UPDATE affiliates SET
                total_earnings = total_earnings + commission_amount,
                pending_payout = pending_payout + commission_amount,
                updated_at = NOW()
            WHERE id = affiliate_record.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award affiliate commissions on trade completion
CREATE TRIGGER award_affiliate_commission_trigger
    AFTER UPDATE ON trade_operations
    FOR EACH ROW
    EXECUTE FUNCTION award_affiliate_commission();

-- Create function to update user balances after trade completion
CREATE OR REPLACE FUNCTION update_user_balance_on_trade()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when trade is closed
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
        IF NEW.result > 0 THEN
            -- Profitable trade
            UPDATE user_balances SET
                total_profit = total_profit + NEW.result,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        ELSE
            -- Loss trade
            UPDATE user_balances SET
                total_loss = total_loss + ABS(NEW.result),
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user balances on trade completion
CREATE TRIGGER update_user_balance_on_trade_trigger
    AFTER UPDATE ON trade_operations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance_on_trade();
