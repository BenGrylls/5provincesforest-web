import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { canAccessCategory, ContentCategory, getAdminSession, isAuthenticated } from '@/lib/auth';
import { isImage, isVideo, isPdf, saveUpload } from '@/lib/uploads';

export async function GET(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    if (category && (!['news', 'media', 'publications'].includes(category) || !await canAccessCategory(request, category as ContentCategory))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    let result;
    if (category) {
      result = await query('SELECT *, created_at as published_at FROM articles WHERE category = $1 ORDER BY event_date DESC', [category]);
    } else {
      result = await query('SELECT *, created_at as published_at FROM articles ORDER BY event_date DESC');
    }
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('GET API Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = contentType.includes('multipart/form-data') ? await request.formData() : await request.json();
    const field = (name: string) => {
      const value = body instanceof FormData ? body.get(name) : body[name];
      return typeof value === 'string' ? value : '';
    };
    const id = field('id');
    const title = field('title').trim();
    const category = field('category');
    const content = field('content');
    const eventDate = field('eventDate');
    const socialVideoUrl = field('socialVideoUrl');
    const seriesKey = field('seriesKey').trim();
    const episodeValue = Number.parseInt(field('episodeNumber'), 10);
    const episodeNumber = Number.isInteger(episodeValue) && episodeValue > 0 ? episodeValue : null;
    
    // เดิม hardcode เป็น 'BorderForest' เสมอ ทำให้ log ผิดคนเมื่อ sub-admin เป็นคนแก้ไขจริง
    const session = await getAdminSession(request);
    const adminUser = session?.username || 'unknown';
    const activeEventDate = eventDate || new Date().toISOString().split('T')[0];
    const existingImages = field('existingImages') || field('imagePaths');
    const pathsArray = existingImages.split(',').map((path) => path.trim())
      .filter((path) => path.startsWith('/uploads/') || /^https:\/\//.test(path));
    const existingVideo = field('existingVideo') || field('videoFile');
    let videoFile = (existingVideo.startsWith('/uploads/') || /^https:\/\//.test(existingVideo)) ? existingVideo : '';
    const existingPdf = field('existingPdf') || field('pdfFile');
    let pdfFile = (existingPdf.startsWith('/uploads/') || /^https:\/\//.test(existingPdf)) ? existingPdf : '';

    if (!title || !['news', 'media', 'publications'].includes(category)) {
      return NextResponse.json({ error: 'Invalid article data' }, { status: 400 });
    }
    if (!await canAccessCategory(request, category as ContentCategory)) {
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
      pathsArray.push(...await Promise.all(imageFiles.map(saveUpload)));

      const video = body.get('videoFile');
      if (video instanceof File && video.size > 0) {
        if (!isVideo(video)) return NextResponse.json({ error: 'วิดีโอต้องเป็น MP4 หรือ WebM' }, { status: 400 });
        videoFile = await saveUpload(video);
      }

      const pdf = body.get('pdfFile');
      if (pdf instanceof File && pdf.size > 0) {
        if (!isPdf(pdf)) return NextResponse.json({ error: 'ไฟล์ต้องเป็น PDF เท่านั้น' }, { status: 400 });
        pdfFile = await saveUpload(pdf);
      }
    }

    if (category === 'media' && !videoFile && !socialVideoUrl) {
      return NextResponse.json({ error: 'Media items require an uploaded video or video URL' }, { status: 400 });
    }

    if (id) {
      await query(
        'UPDATE articles SET title = $1, category = $2, content = $3, event_date = $4, image_paths = $5, video_file = $6, social_video_url = $7, series_key = $8, episode_number = $9, pdf_file = $10 WHERE id = $11',
        [title, category, content, activeEventDate, pathsArray, videoFile, socialVideoUrl, seriesKey, episodeNumber, pdfFile, id]
      );
      await query(
        'INSERT INTO admin_logs (admin_username, action, target_title, category) VALUES ($1, $2, $3, $4)',
        [adminUser, 'UPDATE', title, category]
      );
    } else {
      await query(
        'INSERT INTO articles (title, category, content, event_date, image_paths, video_file, social_video_url, series_key, episode_number, pdf_file) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [title, category, content, activeEventDate, pathsArray, videoFile, socialVideoUrl, seriesKey, episodeNumber, pdfFile]
      );
      await query(
        'INSERT INTO admin_logs (admin_username, action, target_title, category) VALUES ($1, $2, $3, $4)',
        [adminUser, 'INSERT', title, category]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST API Fatal Error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await query(
        'INSERT INTO admin_logs (admin_username, action, target_title, category) VALUES ($1, $2, $3, $4)',
        [adminUser, 'DELETE', title, category]
      );
    }

    await query('DELETE FROM articles WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete error' }, { status: 500 });
  }
}
