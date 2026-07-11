-- Password is: admin123  (change before going live)
INSERT INTO users (id, masjid_id, email, password, role)
VALUES (
  gen_random_uuid(),
  'a1b2c3d4-0000-0000-0000-000000000001',
  'admin@masjid-al-noor.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN'
);
