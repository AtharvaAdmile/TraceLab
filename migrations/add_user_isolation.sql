-- Migration: Add user isolation to all tables
-- Delete existing data and add user_id columns with RLS policies

-- Delete all existing data (in reverse order of dependencies)
DELETE FROM compliance_issues;
DELETE FROM test_cases;
DELETE FROM requirements;
DELETE FROM projects;

-- Drop existing policies that depend on user_id
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view requirements of their projects" ON requirements;
DROP POLICY IF EXISTS "Users can insert requirements to their projects" ON requirements;
DROP POLICY IF EXISTS "Users can view test cases of their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can insert test cases to their projects" ON test_cases;
DROP POLICY IF EXISTS "Users can view executions" ON test_executions;
DROP POLICY IF EXISTS "Users can insert executions" ON test_executions;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can insert own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can update own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can delete own requirements" ON requirements;
DROP POLICY IF EXISTS "Users can view own test_cases" ON test_cases;
DROP POLICY IF EXISTS "Users can insert own test_cases" ON test_cases;
DROP POLICY IF EXISTS "Users can update own test_cases" ON test_cases;
DROP POLICY IF EXISTS "Users can delete own test_cases" ON test_cases;
DROP POLICY IF EXISTS "Users can view own compliance_issues" ON compliance_issues;
DROP POLICY IF EXISTS "Users can insert own compliance_issues" ON compliance_issues;
DROP POLICY IF EXISTS "Users can update own compliance_issues" ON compliance_issues;
DROP POLICY IF EXISTS "Users can delete own compliance_issues" ON compliance_issues;

-- Drop existing user_id columns if they exist
ALTER TABLE projects DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE requirements DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE test_cases DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE compliance_issues DROP COLUMN IF EXISTS user_id CASCADE;

-- Add user_id column to projects table
ALTER TABLE projects ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id column to requirements table
ALTER TABLE requirements ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id column to test_cases table
ALTER TABLE test_cases ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id column to compliance_issues table
ALTER TABLE compliance_issues ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_issues ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create policies for requirements table
CREATE POLICY "Users can view own requirements" ON requirements
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own requirements" ON requirements
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own requirements" ON requirements
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own requirements" ON requirements
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create policies for test_cases table
CREATE POLICY "Users can view own test_cases" ON test_cases
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own test_cases" ON test_cases
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own test_cases" ON test_cases
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own test_cases" ON test_cases
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create policies for compliance_issues table
CREATE POLICY "Users can view own compliance_issues" ON compliance_issues
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own compliance_issues" ON compliance_issues
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own compliance_issues" ON compliance_issues
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own compliance_issues" ON compliance_issues
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_requirements_user_id ON requirements(user_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_issues_user_id ON compliance_issues(user_id);