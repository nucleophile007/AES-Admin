-- Make password fields nullable for Student and Teacher models
-- This allows passwords to be set during activation instead of having default values

-- Update Teacher table
ALTER TABLE "Teacher" ALTER COLUMN "password" DROP DEFAULT;
ALTER TABLE "Teacher" ALTER COLUMN "password" DROP NOT NULL;

-- Update Student table  
ALTER TABLE "Student" ALTER COLUMN "password" DROP DEFAULT;
ALTER TABLE "Student" ALTER COLUMN "password" DROP NOT NULL;

-- Set existing temp passwords to NULL so users need to activate
UPDATE "Teacher" SET "password" = NULL WHERE "password" = 'temp123';
UPDATE "Student" SET "password" = NULL WHERE "password" = 'temp123';
