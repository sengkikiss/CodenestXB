-- EduCore MySQL Schema
-- Run: mysql -u root -p educore < schema.sql

CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('Admin','Teacher','Student','Staff') NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT REFERENCES users(id) ON DELETE CASCADE,
  admission_no      VARCHAR(30) UNIQUE,
  grade             VARCHAR(20),
  section           VARCHAR(5),
  phone             VARCHAR(20),
  dob               DATE,
  gender            VARCHAR(10),
  address           TEXT,
  guardian_name     VARCHAR(100),
  guardian_phone    VARCHAR(20),
  guardian_relation VARCHAR(30),
  blood_group       VARCHAR(5),
  nationality       VARCHAR(50),
  religion          VARCHAR(50),
  medical_notes     TEXT,
  enrolled_at       DATE DEFAULT (CURRENT_DATE),
  status            VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS teachers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT REFERENCES users(id) ON DELETE CASCADE,
  employee_id       VARCHAR(20) UNIQUE,
  subject           VARCHAR(100),
  qualification     VARCHAR(150),
  experience        VARCHAR(50),
  phone             VARCHAR(20),
  dob               DATE,
  gender            VARCHAR(10),
  address           TEXT,
  emergency_contact VARCHAR(20),
  department        VARCHAR(100),
  salary            DECIMAL(10,2),
  join_date         DATE,
  contract_type     VARCHAR(20) DEFAULT 'Permanent',
  status            VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS staff (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT REFERENCES users(id) ON DELETE CASCADE,
  employee_id       VARCHAR(20) UNIQUE,
  role              VARCHAR(50),
  department        VARCHAR(100),
  phone             VARCHAR(20),
  dob               DATE,
  gender            VARCHAR(10),
  address           TEXT,
  emergency_contact VARCHAR(20),
  salary            DECIMAL(10,2),
  join_date         DATE,
  shift             VARCHAR(20) DEFAULT 'Morning',
  contract_type     VARCHAR(20) DEFAULT 'Permanent',
  status            VARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS courses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  code         VARCHAR(20) UNIQUE,
  teacher_id   INT,
  grade        VARCHAR(20),
  section      VARCHAR(5),
  max_students INT DEFAULT 30,
  duration     VARCHAR(30),
  schedule     VARCHAR(100),
  start_date   DATE,
  end_date     DATE,
  room         VARCHAR(50),
  credits      INT DEFAULT 3,
  description  TEXT,
  status       VARCHAR(20) DEFAULT 'Active',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT,
  course_id   INT,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS videos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  teacher_id  INT,
  course_id   INT,
  file_path   VARCHAR(255),
  description TEXT,
  tags        VARCHAR(255),
  views       INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_progress (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT,
  video_id    INT,
  watched_pct INT DEFAULT 0,
  last_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_progress (student_id, video_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT,
  amount      DECIMAL(10,2) NOT NULL,
  discount    DECIMAL(10,2) DEFAULT 0,
  paid        DECIMAL(10,2) DEFAULT 0,
  type        VARCHAR(50),
  method      VARCHAR(50),
  due_date    DATE,
  status      VARCHAR(20) DEFAULT 'Pending',
  invoice_no  VARCHAR(30) UNIQUE,
  reference   VARCHAR(50),
  remarks     TEXT,
  paid_at     TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  content      TEXT NOT NULL,
  teacher_id   INT,
  course_id    INT,
  target_grade VARCHAR(20),
  category     VARCHAR(30) DEFAULT 'General',
  pinned       TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  date       DATE NOT NULL,
  status     ENUM('Present','Absent','Late'),
  marked_by  INT,
  UNIQUE KEY unique_attendance (student_id, date)
);
