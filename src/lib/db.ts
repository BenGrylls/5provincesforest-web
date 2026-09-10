import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let initialization: Promise<void> | undefined;

export async function query(text: string, params?: unknown[]) {
  if (!initialization) {
    initialization = initDB().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
  return pool.query(text, params);
}

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL, 
      content TEXT DEFAULT '',
      event_date DATE DEFAULT CURRENT_DATE,
      image_paths TEXT[] DEFAULT ARRAY[]::TEXT[],
      video_file TEXT DEFAULT '',
      social_video_url TEXT DEFAULT '',
      series_key TEXT DEFAULT '',
      episode_number INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE articles ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_paths TEXT[] DEFAULT ARRAY[]::TEXT[];
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_file TEXT DEFAULT '';
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS social_video_url TEXT DEFAULT '';
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS series_key TEXT DEFAULT '';
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS episode_number INTEGER;
    ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_file TEXT DEFAULT '';

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY DEFAULT 'global',
      is_grayscale BOOLEAN DEFAULT false
    );

    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_enabled BOOLEAN DEFAULT false;
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_image TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_title TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_message TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_link TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_link_text TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_subtitle TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_date TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_footer TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_ornament TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_title_size INTEGER DEFAULT 28;
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_subtitle_size INTEGER DEFAULT 20;
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_date_size INTEGER DEFAULT 16;
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS important_cover_footer_size INTEGER DEFAULT 12;

    CREATE TABLE IF NOT EXISTS admin_logs (
      id SERIAL PRIMARY KEY,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL, 
      target_title TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sub_admins (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS committee_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      image_path TEXT DEFAULT '',
      image_data BYTEA,
      image_mime TEXT DEFAULT '',
      biography TEXT DEFAULT '',
      responsibilities TEXT DEFAULT '',
      biography_sections JSONB DEFAULT '[]'::JSONB
    );

    ALTER TABLE committee_profiles ADD COLUMN IF NOT EXISTS image_path TEXT DEFAULT '';
    ALTER TABLE committee_profiles ADD COLUMN IF NOT EXISTS image_data BYTEA;
    ALTER TABLE committee_profiles ADD COLUMN IF NOT EXISTS image_mime TEXT DEFAULT '';
    ALTER TABLE committee_profiles ADD COLUMN IF NOT EXISTS biography_sections JSONB DEFAULT '[]'::JSONB;

    CREATE TABLE IF NOT EXISTS committee_units (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      responsibilities TEXT[] DEFAULT ARRAY[]::TEXT[],
      sort_order INTEGER UNIQUE NOT NULL
    );

    INSERT INTO site_settings (id, is_grayscale) 
    VALUES ('global', false) 
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO committee_profiles (id, name, position, biography, responsibilities)
    VALUES ('president', 'พลเอก นามสมมติ นามสกุล', 'ประธานกรรมการมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด', 'ดำรงตำแหน่งประธานกรรมการมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด มีบทบาทสำคัญในการขับเคลื่อนนโยบายอนุรักษ์ทรัพยากรธรรมชาติป่าไม้และสัตว์ป่าในพื้นที่ภาคตะวันออก', 'กำกับทิศทางและนโยบายการอนุรักษ์ทรัพยากรธรรมชาติในพื้นที่รอยต่อ ๕ จังหวัด')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO committee_units (title, sort_order)
    VALUES
      ('ฝ่ายอนุรักษ์ทรัพยากรสัตว์ป่า', 1), ('ฝ่ายอนุรักษ์ทรัพยากรดินและน้ำ', 2), ('ฝ่ายอนุรักษ์ทรัพยากรพันธุ์พืช', 3),
      ('ฝ่ายส่งเสริมคุณภาพชีวิตราษฎร', 4), ('ฝ่ายประชาสัมพันธ์และจัดกิจกรรม', 5), ('ฝ่ายหารายได้', 6),
      ('ฝ่ายสวัสดิการ', 7), ('ฝ่ายตรวจสอบและประเมินผล', 8), ('ฝ่ายกฎหมาย', 9), ('ฝ่ายงบประมาณ', 10)
    ON CONFLICT (sort_order) DO NOTHING;
  `);
}
