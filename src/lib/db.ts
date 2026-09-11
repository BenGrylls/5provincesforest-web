import { readFile } from 'fs/promises';
import path from 'path';
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

    CREATE TABLE IF NOT EXISTS history_page (
      id TEXT PRIMARY KEY DEFAULT 'global',
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      content TEXT DEFAULT '',
      images JSONB DEFAULT '[]'::JSONB,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT 'leaf',
      sort_order INTEGER NOT NULL
    );

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

    INSERT INTO objectives (title, description, icon, sort_order)
    SELECT * FROM (VALUES
      ('๑. ฟื้นฟูและอนุรักษ์ผืนป่า', 'ส่งเสริมการปลูกป่า สร้างฝายชะลอน้ำ และปกป้องพื้นที่ป่าไม้จากการถูกทำลาย', 'leaf', 1),
      ('๒. อนุรักษ์สัตว์ป่า', 'จัดทำโป่งเทียม แหล่งน้ำ และแก้ปัญหาความขัดแย้งระหว่างคนกับช้างป่าอย่างสันติวิธี', 'shield', 2),
      ('๓. พัฒนาคุณภาพชีวิตราษฎร', 'สนับสนุนอาชีพ ให้ทุนการศึกษา และสร้างแนวกันชนเพื่อให้ชุมชนพึ่งพาตนเองได้โดยไม่บุกรุกป่า', 'target', 3)
    ) AS seed(title, description, icon, sort_order)
    WHERE NOT EXISTS (SELECT 1 FROM objectives);

    INSERT INTO committee_units (title, sort_order)
    VALUES
      ('ฝ่ายอนุรักษ์ทรัพยากรสัตว์ป่า', 1), ('ฝ่ายอนุรักษ์ทรัพยากรดินและน้ำ', 2), ('ฝ่ายอนุรักษ์ทรัพยากรพันธุ์พืช', 3),
      ('ฝ่ายส่งเสริมคุณภาพชีวิตราษฎร', 4), ('ฝ่ายประชาสัมพันธ์และจัดกิจกรรม', 5), ('ฝ่ายหารายได้', 6),
      ('ฝ่ายสวัสดิการ', 7), ('ฝ่ายตรวจสอบและประเมินผล', 8), ('ฝ่ายกฎหมาย', 9), ('ฝ่ายงบประมาณ', 10)
    ON CONFLICT (sort_order) DO NOTHING;
  `);

  await migrateHistoryFromFile();
}

const HISTORY_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'history.json');

const HISTORY_DEFAULTS = {
  title: 'ประวัติความเป็นมา มูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด',
  subtitle: 'โครงการอนุรักษ์ทรัพยากรป่าไม้และสัตว์ป่า ในพื้นที่รอยต่อ ๕ จังหวัดภาคตะวันออก',
  coverImage: '',
  content: '',
  images: [] as unknown[],
};

/**
 * สร้างแถวตั้งต้นของหน้าประวัติความเป็นมา (ตารางนี้มีแถวเดียว id='global')
 *
 * เดิมข้อมูลหน้านี้เก็บใน src/data/history.json ซึ่งแอปเขียนทับตอน runtime
 * ทั้งที่ไฟล์ถูก track ใน git ผลคือทุกครั้งที่แอดมินกดบันทึกจะมีไฟล์เปลี่ยนค้าง
 * สองคนแก้พร้อมกันก็ conflict และตอน deploy ถ้า pull ทับ ข้อมูลจะหายไปเลย
 *
 * ไฟล์ JSON ถูกลบออกไปแล้วหลังย้ายข้อมูลขึ้นฐานข้อมูลเรียบร้อย แต่ยังอ่านเผื่อไว้
 * สำหรับเครื่องที่ยัง checkout คอมมิตเก่าอยู่ — ถ้าไม่มีไฟล์ก็ใช้ค่าตั้งต้นแทน
 * (ต้องมีแถวนี้เสมอ ไม่งั้นหน้า admin จะไม่มีอะไรให้แก้)
 *
 * ทำงานครั้งเดียวตอนตารางยังว่าง ถ้ามีข้อมูลอยู่แล้วจะไม่แตะต้อง
 */
async function migrateHistoryFromFile() {
  const existing = await pool.query('SELECT 1 FROM history_page WHERE id = $1', ['global']);
  if (existing.rows.length > 0) return;

  let data = { ...HISTORY_DEFAULTS };
  try {
    const parsed = JSON.parse(await readFile(HISTORY_FILE_PATH, 'utf8'));
    data = {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      subtitle: typeof parsed.subtitle === 'string' ? parsed.subtitle : '',
      coverImage: typeof parsed.coverImage === 'string' ? parsed.coverImage : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      images: Array.isArray(parsed.images) ? parsed.images : [],
    };
  } catch {
    // ไม่มีไฟล์เดิม (ติดตั้งใหม่) — ใช้ค่าตั้งต้น
  }

  await pool.query(
    `INSERT INTO history_page (id, title, subtitle, cover_image, content, images)
     VALUES ('global', $1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [data.title, data.subtitle, data.coverImage, data.content, JSON.stringify(data.images)],
  );
}
