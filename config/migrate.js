require("dotenv").config();
const { pool } = require("./db");

const schema = `
-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  NOT NULL CHECK (role IN ('Admin','Teacher','Student','Staff')),
  avatar_url   VARCHAR(255),
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Students ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                SERIAL PRIMARY KEY,
  user_id           INT REFERENCES users(id) ON DELETE CASCADE,
  admission_no      VARCHAR(30) UNIQUE NOT NULL,
  first_name        VARCHAR(80) NOT NULL,
  last_name         VARCHAR(80) NOT NULL,
  email             VARCHAR(150) UNIQUE NOT NULL,
  phone             VARCHAR(20),
  dob               DATE,
  gender            VARCHAR(10),
  grade             VARCHAR(20),
  section           VARCHAR(5),
  address           TEXT,
  blood_group       VARCHAR(5),
  nationality       VARCHAR(60),
  religion          VARCHAR(60),
  guardian_name     VARCHAR(150),
  guardian_phone    VARCHAR(20),
  guardian_relation VARCHAR(30),
  medical_notes     TEXT,
  status            VARCHAR(20) DEFAULT 'Active',
  enrolled_at       DATE DEFAULT CURRENT_DATE,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ─── Teachers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id                 SERIAL PRIMARY KEY,
  user_id            INT REFERENCES users(id) ON DELETE CASCADE,
  employee_id        VARCHAR(30) UNIQUE NOT NULL,
  prefix             VARCHAR(10),
  first_name         VARCHAR(80) NOT NULL,
  last_name          VARCHAR(80) NOT NULL,
  email              VARCHAR(150) UNIQUE NOT NULL,
  phone              VARCHAR(20),
  dob                DATE,
  gender             VARCHAR(10),
  subject            VARCHAR(100),
  qualification      VARCHAR(150),
  experience         VARCHAR(50),
  department         VARCHAR(100),
  salary             DECIMAL(10,2),
  address            TEXT,
  emergency_contact  VARCHAR(20),
  contract_type      VARCHAR(30) DEFAULT 'Permanent',
  status             VARCHAR(20) DEFAULT 'Active',
  joined_at          DATE DEFAULT CURRENT_DATE,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ─── Staff ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id                 SERIAL PRIMARY KEY,
  user_id            INT REFERENCES users(id) ON DELETE CASCADE,
  employee_id        VARCHAR(30) UNIQUE NOT NULL,
  first_name         VARCHAR(80) NOT NULL,
  last_name          VARCHAR(80) NOT NULL,
  email              VARCHAR(150) UNIQUE NOT NULL,
  phone              VARCHAR(20),
  dob                DATE,
  gender             VARCHAR(10),
  role               VARCHAR(60),
  department         VARCHAR(100),
  shift              VARCHAR(20),
  salary             DECIMAL(10,2),
  address            TEXT,
  emergency_contact  VARCHAR(20),
  contract_type      VARCHAR(30) DEFAULT 'Permanent',
  status             VARCHAR(20) DEFAULT 'Active',
  joined_at          DATE DEFAULT CURRENT_DATE,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ─── Courses ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(30) UNIQUE NOT NULL,
  name         VARCHAR(200) NOT NULL,
  description  TEXT,
  teacher_id   INT REFERENCES teachers(id) ON DELETE SET NULL,
  grade        VARCHAR(20),
  section      VARCHAR(5),
  room         VARCHAR(30),
  max_students INT DEFAULT 30,
  schedule     VARCHAR(100),
  duration     VARCHAR(30),
  credits      INT DEFAULT 3,
  start_date   DATE,
  end_date     DATE,
  status       VARCHAR(20) DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Enrollments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES students(id) ON DELETE CASCADE,
  course_id   INT REFERENCES courses(id)  ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- ─── Videos ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  tags        TEXT,
  teacher_id  INT REFERENCES teachers(id) ON DELETE SET NULL,
  course_id   INT REFERENCES courses(id)  ON DELETE SET NULL,
  grade       VARCHAR(20),
  file_path   VARCHAR(255),
  file_size   BIGINT,
  duration    VARCHAR(20),
  views       INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ─── Video Progress ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_progress (
  id           SERIAL PRIMARY KEY,
  student_id   INT REFERENCES students(id) ON DELETE CASCADE,
  video_id     INT REFERENCES videos(id)   ON DELETE CASCADE,
  watched_pct  INT DEFAULT 0,
  last_watched TIMESTAMP DEFAULT NOW(),
  completed    BOOLEAN DEFAULT false,
  UNIQUE(student_id, video_id)
);

-- ─── Payments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL PRIMARY KEY,
  invoice_no   VARCHAR(30) UNIQUE NOT NULL,
  student_id   INT REFERENCES students(id) ON DELETE CASCADE,
  amount       DECIMAL(10,2) NOT NULL,
  discount     DECIMAL(10,2) DEFAULT 0,
  paid_amount  DECIMAL(10,2) DEFAULT 0,
  type         VARCHAR(60),
  method       VARCHAR(40),
  reference    VARCHAR(60),
  status       VARCHAR(20) DEFAULT 'Pending',
  remarks      TEXT,
  due_date     DATE,
  paid_at      TIMESTAMP,
  created_by   INT REFERENCES users(id),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Notes ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  content      TEXT NOT NULL,
  category     VARCHAR(40) DEFAULT 'General',
  teacher_id   INT REFERENCES teachers(id) ON DELETE SET NULL,
  course_id    INT REFERENCES courses(id)  ON DELETE SET NULL,
  target_grade VARCHAR(20),
  pinned       BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─── Attendance ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES students(id) ON DELETE CASCADE,
  course_id   INT REFERENCES courses(id)  ON DELETE SET NULL,
  date        DATE NOT NULL,
  status      VARCHAR(20) NOT NULL CHECK (status IN ('Present','Absent','Late','Excused')),
  remarks     TEXT,
  marked_by   INT REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, date, course_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_grade       ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_status      ON students(status);
CREATE INDEX IF NOT EXISTS idx_payments_student     ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date      ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student   ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_videos_course        ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_notes_course         ON notes(course_id);
`;

async function migrate() {
  try {
    await pool.query(schema);
    console.log("✅ Database migration completed successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
