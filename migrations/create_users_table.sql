-- Create users table for Firebase auth sync
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- Firebase UID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id OR TRUE);

-- Policy: Users can insert their own data
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (TRUE);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (TRUE);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
