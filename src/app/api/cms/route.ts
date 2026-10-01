import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { canAccessCategory, CATEGORY_PERMISSIONS, ContentCategory, getAdminSession, isAuthenticated } from '@/lib/auth';
import { logCsrfBlocked, logForbidden, writeAuditLog } from '@/lib/audit-log';
import { sameOrigin } from '@/lib/csrf';
import { isImage, isVideo, isPdf, saveUpload, type UploadFolder } from '@/lib/uploads';
import { validateTitle, validateContent, validateUrl } from '@/lib/input-validation';
import { checkRateLimit, recordRequest, getRateLimitResetSeconds } from '@/lib/api-rate-limit';
import { logException, logDatabaseError } from '@/lib/application-logger';
import { logPerformance } from '@/lib/performance-logger';

// PATCH(2): reverse ของ CATEGORY_PERMISSIONS ใน lib/auth.ts — ไว้แปล permission string
// ที่เก็บใน sub_admins.permissions กลับเป็นชื่อ category ของตาราง articles
const CATEGORY_BY_PERMISSION = Object.fromEntries(
  Object.entries(CATEGORY_PERMISSIONS).map(([category, permission]) => [permission, category]),
) as Record<string, ContentCategory>;

export async function GET(request: Request) {
  const startTime = Date.now();
  let queryCount = 0;

  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    // ดึง session ไว้ก่อนใช้ทั้งเช็คสิทธิ์และ log
    const session = await getAdminSession(request);
    queryCount++; // getAdminSession may query database
    
    if (category && (!['news', 'media', 'publications'].includes(category) || !await canAccessCategory(request, category as ContentCategory))) {
      await logForbidden(request, {
        username: session?.username || 'unknown',
        category: 'cms',
        targetType: 'article_category',
        targetTitle: category,
        reason: 'ไม่มีสิทธิ์เข้าถึงหมวดนี้',
      });
      
      // Log performance for 403 response
      const responseTimeMs = Date.now() - startTime;
      await logPerformance({
        endpoint: '/api/cms',
        method: 'GET',
        statusCode: 403,
        responseTimeMs,
        userId: session?.username,
        queryCount,
      });
      
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // PATCH(2): เดิม sub-admin ที่เรียกไม่ระบุ category จะได้ข้อมูลทุกหมวด แม้มีสิทธิ์แค่หมวดเดียว
    // ตอนนี้บังคับให้เห็นเฉพาะหมวดที่ตัวเองมีสิทธิ์เท่านั้น
    let result;
    if (category) {
      result = await query('SELECT *, created_at as published_at FROM articles WHERE category = $1 ORDER BY event_date DESC', [category]);
      queryCount++;
    } else if (session?.role === 'super_admin') {
      result = await query('SELECT *, created_at as published_at FROM articles ORDER BY event_date DESC');
      queryCount++;
    } else {
      const allowed = (session?.permissions ?? [])
        .map((perm: string) => CATEGORY_BY_PERMISSION[perm])
        .filter((cat: ContentCategory | undefined): cat is ContentCategory => Boolean(cat));
      if (allowed.length === 0) {
        const responseTimeMs = Date.now() - startTime;
        await logPerformance({
          endpoint: '/api/cms',
          method: 'GET',
          statusCode: 200,
          responseTimeMs,
          userId: session?.username,
          queryCount,
        });
        return NextResponse.json([]);
      }
      result = await query('SELECT *, created_at as published_at FROM articles WHERE category = ANY($1) ORDER BY event_date DESC', [allowed]);
      queryCount++;
    }
    
    const responseTimeMs = Date.now() - startTime;
    await logPerformance({
      endpoint: '/api/cms',
      method: 'GET',
      statusCode: 200,
      responseTimeMs,
      userId: session?.username,
      queryCount,
      details: {
        result_count: result.rows?.length || 0,
      },
    });
    
    return NextResponse.json(result.rows || []);
  } catch (error) {
    // Log error for debugging
    const responseTimeMs = Date.now() - startTime;
    await logPerformance({
      endpoint: '/api/cms',
      method: 'GET',
      statusCode: 500,
      responseTimeMs,
      queryCount,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    
    await logException(error, {
      endpoint: '/api/cms',
      action: 'get_articles',
    });
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 30 mutations per 60 seconds per IP
  if (!checkRateLimit(request, 'mutation')) {
    const retryAfter = getRateLimitResetSeconds(request, 'mutation');
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  recordRequest(request, 'mutation');

  try {
    const contentType = request.headers.get('content-type') || '';
    const body = contentType.includes('multipart/form-data') ? await request.formData() : await request.json();
    const field = (name: string) => {
      const value = body instanceof FormData ? body.get(name) : body[name];
      return typeof value === 'string' ? value : '';
    };
    const id = field('id');
    const title = field('title').trim();
    const category = field('category').trim();
    const content = field('content');
    const eventDate = field('eventDate');
    const socialVideoUrl = field('socialVideoUrl');
    const seriesKey = field('seriesKey').trim();
    const episodeValue = Number.parseInt(field('episodeNumber'), 10);
    const episodeNumber = Number.isInteger(episodeValue) && episodeValue > 0 ? episodeValue : null;

    // Validate inputs
    const titleValidation = validateTitle(title);
    if (!titleValidation.valid) {
      return NextResponse.json({ error: titleValidation.error }, { status: 400 });
    }

    const contentValidation = validateContent(content, 10000);
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 });
    }

    if (socialVideoUrl) {
      const urlValidation = validateUrl(socialVideoUrl);
      if (!urlValidation.valid) {
        return NextResponse.json({ error: urlValidation.error }, { status: 400 });
      }
    }

    if (seriesKey && seriesKey.length > 100) {
      return NextResponse.json({ error: 'Series key ต้องไม่เกิน 100 ตัวอักษร' }, { status: 400 });
    }

    // เดิม hardcode เป็น 'BorderForest' เสมอ ทำให้ log ผิดคนเมื่อ sub-admin เป็นคนแก้ไขจริง
    const session = await getAdminSession(request);
    const adminUser = session?.username || 'unknown';
    const activeEventDate = eventDate || new Date().toISOString().split('T')[0];
    const existingImages = field('existingImages') || field('imagePaths');
    const pathsArray = existingImages.split(',').map((path) => path.trim())
      .filter((path) => path.startsWith('/uploads/') || /^https:\/\//.test(path));
    const existingVideo = field('existingVideo') || field('videoFile');
    let videoFile = (existingVideo.startsWith('/uploads/') || /^https:\/\//.test(existingVideo)) ? existingVideo : '';
    const existingCardCover = field('existingCardCover');
    let cardCoverImage = (existingCardCover.startsWith('/uploads/') || /^https:\/\//.test(existingCardCover)) ? existingCardCover : '';
    const existingPdf = field('existingPdf') || field('pdfFile');
    let pdfFile = (existingPdf.startsWith('/uploads/') || /^https:\/\//.test(existingPdf)) ? existingPdf : '';
    const htmlUrlValidation = validateUrl(field('htmlUrl'));
    if (!htmlUrlValidation.valid) {
      return NextResponse.json({ error: 'ลิงก์เอกสารต้องเป็น HTTPS ที่ถูกต้อง' }, { status: 400 });
    }
    const htmlUrl = category === 'publications' ? htmlUrlValidation.value || '' : '';

    if (!titleValidation.value || !['news', 'media', 'publications'].includes(category)) {
      return NextResponse.json({ error: 'Invalid article data' }, { status: 400 });
    }
    if (!await canAccessCategory(request, category as ContentCategory)) {
      await logForbidden(request, {
        username: adminUser,
        category: 'cms',
        targetType: 'article_category',
        targetTitle: category,
        reason: 'ไม่มีสิทธิ์แก้ไขหมวดนี้',
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (socialVideoUrl && !/^https:\/\//.test(socialVideoUrl)) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    if (body instanceof FormData) {
      const imageFiles = body.getAll('imageFiles').filter((file): file is File => file instanceof File && file.size > 0);
      if (imageFiles.some((file) => !isImage(file))) {
        return NextResponse.json({ error: 'รูปภาพต้องเป็น JPG, PNG หรือ WebP' }, { status: 400 });
      }
      // ไฟล์ของบทความเก็บในโฟลเดอร์ตามหมวดของบทความนั้น (news / media / publications)
      const folder = category as UploadFolder;
      // เดิมเขียน imageFiles.map(saveUpload) ซึ่งส่ง (file, index, array) เข้าฟังก์ชันด้วย
      pathsArray.push(...await Promise.all(imageFiles.map((file) => saveUpload(file, folder))));

      const cardCover = body.get('cardCoverFile');
      if (cardCover instanceof File && cardCover.size > 0) {
        if (!isImage(cardCover)) return NextResponse.json({ error: 'ภาพปกต้องเป็น JPG, PNG หรือ WebP' }, { status: 400 });
        cardCoverImage = await saveUpload(cardCover, folder);
      }

      const video = body.get('videoFile');
      if (video instanceof File && video.size > 0) {
        if (!isVideo(video)) return NextResponse.json({ error: 'วิดีโอต้องเป็น MP4 หรือ WebM' }, { status: 400 });
        videoFile = await saveUpload(video, folder);
      }

      const pdf = body.get('pdfFile');
      if (pdf instanceof File && pdf.size > 0) {
        if (!isPdf(pdf)) return NextResponse.json({ error: 'ไฟล์ต้องเป็น PDF เท่านั้น' }, { status: 400 });
        pdfFile = await saveUpload(pdf, folder);
      }
    }

    if (category === 'media' && !videoFile && !socialVideoUrl) {
      return NextResponse.json({ error: 'Media items require an uploaded video or video URL' }, { status: 400 });
    }

    if (id) {
      // ดึงค่าก่อนแก้ไว้เทียบ เก็บลง detail (เฉพาะฟิลด์หลักที่มีความหมายเวลาสืบย้อนหลัง ไม่เอาเนื้อหาเต็ม)
      const before = await query('SELECT title, category, event_date FROM articles WHERE id = $1', [id]);
      const beforeRow = before.rows[0];

      await query(
        'UPDATE articles SET title = $1, category = $2, content = $3, event_date = $4, image_paths = $5, video_file = $6, social_video_url = $7, series_key = $8, episode_number = $9, card_cover_image = $10, pdf_file = $11, html_url = $12 WHERE id = $13',
        [titleValidation.value, category, contentValidation.value, activeEventDate, pathsArray, videoFile, socialVideoUrl || '', seriesKey, episodeNumber, cardCoverImage, pdfFile, htmlUrl, id]
      );
      await writeAuditLog({
        request,
        username: adminUser,
        action: 'UPDATE',
        category,
        targetType: 'article',
        targetId: id,
        targetTitle: titleValidation.value,
        detail: beforeRow ? {
          before: { title: beforeRow.title, category: beforeRow.category, event_date: beforeRow.event_date },
          after: { title: titleValidation.value, category, event_date: activeEventDate },
        } : null,
      });
    } else {
      const created = await query(
        'INSERT INTO articles (title, category, content, event_date, image_paths, video_file, social_video_url, series_key, episode_number, card_cover_image, pdf_file, html_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id',
        [titleValidation.value, category, contentValidation.value, activeEventDate, pathsArray, videoFile, socialVideoUrl || '', seriesKey, episodeNumber, cardCoverImage, pdfFile, htmlUrl]
      );
      await writeAuditLog({
        request,
        username: adminUser,
        action: 'CREATE',
        category,
        targetType: 'article',
        targetId: created.rows[0]?.id ?? null,
        targetTitle: titleValidation.value,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error for debugging
    await logException(error, {
      endpoint: '/api/cms',
      action: 'create_or_update_article',
    });
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) {
    await logCsrfBlocked(request);
    return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
  }
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 30 mutations per 60 seconds per IP
  if (!checkRateLimit(request, 'mutation')) {
    const retryAfter = getRateLimitResetSeconds(request, 'mutation');
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
  recordRequest(request, 'mutation');

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const session = await getAdminSession(request);
    const adminUser = session?.username || 'unknown';

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const target = await query('SELECT title, category FROM articles WHERE id = $1', [id]);
    if (target.rows.length > 0) {
      const { title, category } = target.rows[0];
      if (!['news', 'media', 'publications'].includes(category) || !await canAccessCategory(request, category as ContentCategory)) {
        await logForbidden(request, {
          username: adminUser,
          category: 'cms',
          targetType: 'article',
          targetId: id,
          targetTitle: title,
          reason: 'ไม่มีสิทธิ์ลบข้อมูลหมวดนี้',
        });
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await writeAuditLog({
        request,
        username: adminUser,
        action: 'DELETE',
        category,
        targetType: 'article',
        targetId: id,
        targetTitle: title,
        detail: { deleted: { title, category } },
      });
    }

    await query('DELETE FROM articles WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log error for debugging
    await logException(error, {
      endpoint: '/api/cms',
      action: 'delete_article',
    });
    return NextResponse.json({ error: 'Delete error' }, { status: 500 });
  }
}