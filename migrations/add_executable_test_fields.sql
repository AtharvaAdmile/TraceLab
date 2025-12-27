-- Migration: Add executable test fields to test_cases table
-- Run this in your Supabase SQL Editor to add the new columns

-- Add test_script column (stores the executable Python pytest code)
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS test_script TEXT DEFAULT '';

-- Add dependencies column (stores array of pip packages needed)
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT ARRAY['pytest']::TEXT[];

-- Add target_files column (stores array of repo files this test applies to)
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS target_files TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add repo_url column (stores the GitHub repository URL)
ALTER TABLE test_cases 
ADD COLUMN IF NOT EXISTS repo_url TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN test_cases.test_script IS 'Executable Python pytest code for this test case';
COMMENT ON COLUMN test_cases.dependencies IS 'Array of pip packages required to run this test (e.g., pytest, requests)';
COMMENT ON COLUMN test_cases.target_files IS 'Array of repository file paths this test validates (e.g., src/auth/login.py)';
COMMENT ON COLUMN test_cases.repo_url IS 'GitHub repository URL this test case was generated for';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'test_cases' 
AND column_name IN ('test_script', 'dependencies', 'target_files', 'repo_url');
