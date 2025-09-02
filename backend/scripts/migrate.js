const { getDB } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const createTables = async () => {
  const db = getDB();

  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_confirmed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_sign_in_at TIMESTAMP WITH TIME ZONE,
      deleted_at TIMESTAMP WITH TIME ZONE
    )`,

    // User roles table
    `CREATE TABLE IF NOT EXISTS user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // Profiles table
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT,
      avatar_url TEXT,
      phone TEXT,
      address TEXT,
      id_number TEXT,
      emergency_contact TEXT,
      email_notifications BOOLEAN DEFAULT TRUE,
      push_notifications BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // Notification preferences table
    `CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      push_enabled BOOLEAN DEFAULT FALSE,
      push_token TEXT,
      match_reminders BOOLEAN DEFAULT TRUE,
      goal_alerts BOOLEAN DEFAULT TRUE,
      ticket_alerts BOOLEAN DEFAULT TRUE,
      news_alerts BOOLEAN DEFAULT TRUE,
      merchandise_alerts BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // News table
    `CREATE TABLE IF NOT EXISTS news (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      featured_image TEXT,
      category TEXT DEFAULT 'Berita',
      author_id UUID REFERENCES users(id),
      published BOOLEAN DEFAULT FALSE,
      published_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // News views table
    `CREATE TABLE IF NOT EXISTS news_views (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id),
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // News likes table
    `CREATE TABLE IF NOT EXISTS news_likes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(news_id, user_id)
    )`,

    // News comments table
    `CREATE TABLE IF NOT EXISTS news_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES news_comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Matches table
    `CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      home_team TEXT NOT NULL,
      away_team TEXT NOT NULL,
      home_team_logo TEXT,
      away_team_logo TEXT,
      match_date TIMESTAMP NOT NULL,
      venue TEXT,
      competition TEXT,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
      home_score INTEGER DEFAULT 0,
      away_score INTEGER DEFAULT 0,
      current_minute INTEGER DEFAULT 0,
      extra_time INTEGER DEFAULT 0,
      is_timer_active BOOLEAN DEFAULT FALSE,
      half_time_break BOOLEAN DEFAULT FALSE,
      match_started_at TIMESTAMP WITH TIME ZONE,
      match_ended_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Match events table
    `CREATE TABLE IF NOT EXISTS match_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      event_time INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'yellow_card', 'red_card', 'substitution', 'half_time', 'full_time')),
      team TEXT,
      player_name TEXT,
      description TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Tickets table
    `CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID REFERENCES matches(id),
      ticket_type TEXT NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      total_quantity INTEGER NOT NULL,
      available_quantity INTEGER NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Ticket orders table
    `CREATE TABLE IF NOT EXISTS ticket_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      ticket_id UUID NOT NULL REFERENCES tickets(id),
      quantity INTEGER NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
      payment_method TEXT,
      payment_reference TEXT,
      order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Merchandise categories table
    `CREATE TABLE IF NOT EXISTS merchandise_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Merchandise table
    `CREATE TABLE IF NOT EXISTS merchandise (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(12,2) NOT NULL,
      category_id UUID REFERENCES merchandise_categories(id),
      image_url TEXT,
      colors TEXT[] DEFAULT '{}',
      sizes TEXT[] DEFAULT '{}',
      stock_quantity INTEGER DEFAULT 0,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Cart items table
    `CREATE TABLE IF NOT EXISTS cart_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      merchandise_id UUID NOT NULL REFERENCES merchandise(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      size TEXT,
      color TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, merchandise_id, size, color)
    )`,

    // Merchandise orders table
    `CREATE TABLE IF NOT EXISTS merchandise_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      total_amount DECIMAL(12,2) NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
      order_status TEXT DEFAULT 'processing' CHECK (order_status IN ('processing', 'shipped', 'delivered', 'cancelled')),
      payment_method TEXT,
      payment_reference TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Merchandise order items table
    `CREATE TABLE IF NOT EXISTS merchandise_order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES merchandise_orders(id) ON DELETE CASCADE,
      merchandise_id UUID NOT NULL REFERENCES merchandise(id),
      quantity INTEGER NOT NULL,
      price DECIMAL(12,2) NOT NULL,
      size TEXT,
      color TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Players table
    `CREATE TABLE IF NOT EXISTS players (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      jersey_number INTEGER,
      nationality TEXT,
      date_of_birth DATE,
      height INTEGER,
      weight INTEGER,
      bio TEXT,
      photo_url TEXT,
      player_type TEXT DEFAULT 'player' CHECK (player_type IN ('player', 'coach', 'staff')),
      role_title TEXT,
      experience_years INTEGER,
      achievements TEXT[] DEFAULT '{}',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Gallery table
    `CREATE TABLE IF NOT EXISTS gallery (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      video_url TEXT,
      thumbnail_url TEXT,
      media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
      category TEXT,
      duration TEXT,
      event_date DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
      notification_type TEXT DEFAULT 'general' CHECK (notification_type IN ('general', 'match_reminder', 'goal_alert', 'ticket_alert', 'news_alert', 'merchandise_alert')),
      data JSONB DEFAULT '{}',
      action_url TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      push_sent BOOLEAN DEFAULT FALSE,
      scheduled_for TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Scanner users table
    `CREATE TABLE IF NOT EXISTS scanner_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Ticket scans table
    `CREATE TABLE IF NOT EXISTS ticket_scans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_order_id UUID NOT NULL REFERENCES ticket_orders(id),
      scanner_user_id UUID REFERENCES scanner_users(id),
      scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Promo codes table
    `CREATE TABLE IF NOT EXISTS promo_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      promo_type TEXT NOT NULL CHECK (promo_type IN ('ticket', 'merchandise', 'both')),
      discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(12,2) NOT NULL,
      min_purchase_amount DECIMAL(12,2) DEFAULT 0,
      max_discount_amount DECIMAL(12,2),
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,

    // Website visitors table
    `CREATE TABLE IF NOT EXISTS website_visitors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      visitor_ip TEXT,
      user_agent TEXT,
      page_path TEXT,
      session_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  // Execute all table creation queries
  for (const table of tables) {
    await db.query(table);
  }

  console.log('All tables created successfully');
};

const createIndexes = async () => {
  const db = getDB();

  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at)',
    'CREATE INDEX IF NOT EXISTS idx_news_published ON news(published)',
    'CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug)',
    'CREATE INDEX IF NOT EXISTS idx_news_category ON news(category)',
    'CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date)',
    'CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read)',
    'CREATE INDEX IF NOT EXISTS idx_merchandise_available ON merchandise(is_available)',
    'CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_ticket_orders_user_id ON ticket_orders(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_ticket_orders_payment_status ON ticket_orders(payment_status)'
  ];

  for (const index of indexes) {
    await db.query(index);
  }

  console.log('All indexes created successfully');
};

const createTriggers = async () => {
  const db = getDB();

  // Updated timestamp trigger function
  await db.query(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  // Apply trigger to all tables with updated_at column
  const triggerTables = [
    'users', 'user_roles', 'profiles', 'notification_preferences',
    'news', 'news_comments', 'matches', 'match_events', 'tickets',
    'ticket_orders', 'merchandise_categories', 'merchandise',
    'cart_items', 'merchandise_orders', 'players', 'gallery',
    'notifications', 'scanner_users', 'promo_codes'
  ];

  for (const table of triggerTables) {
    await db.query(`
      DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
      CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column()
    `);
  }

  console.log('All triggers created successfully');
};

const createAdminUser = async () => {
  const db = getDB();

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@persiraja.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin already exists
    const existingAdmin = await db.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const adminId = uuidv4();

    await db.query('BEGIN');

    // Insert admin user
    await db.query(
      'INSERT INTO users (id, email, password_hash, email_confirmed) VALUES ($1, $2, $3, $4)',
      [adminId, adminEmail, hashedPassword, true]
    );

    // Insert admin profile
    await db.query(
      'INSERT INTO profiles (user_id, full_name) VALUES ($1, $2)',
      [adminId, 'Super Admin']
    );

    // Insert admin role
    await db.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [adminId, 'super_admin']
    );

    // Insert notification preferences
    await db.query(
      'INSERT INTO notification_preferences (user_id) VALUES ($1)',
      [adminId]
    );

    await db.query('COMMIT');

    console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating admin user:', error);
  }
};

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    await createTables();
    await createIndexes();
    await createTriggers();
    await createAdminUser();
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase
};

// Run migration if called directly
if (require.main === module) {
  const { connectDB } = require('../config/database');
  
  (async () => {
    try {
      await connectDB();
      await initializeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}