'use client';
import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Edit, X, Save, Image as ImageIcon, Video, Link2, FolderOpen, AlertCircle, Loader, Search, History } from 'lucide-react';
import Combobox from '@/components/Combobox';
import AdminShell from '@/components/admin/AdminShell';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/admin/States';
import { toast } from '@/components/admin/toast';

const TAB_META: Record<string, { title: string; description: string }> = {
  news: { title: 'กิจกรรมและประชาสัมพันธ์', description: 'ข่าวสารและกิจกรรมที่แสดงบนหน้าเว็บไซต์' },
  media: { title: 'สื่อและสารคดีธรรมชาติ', description: 'คลิปวิดีโอและสารคดี จัดกลุ่มเป็นซีรีส์ได้' },
  publications: { title: 'คลังเอกสารและวารสาร', description: 'ไฟล์ PDF ที่เปิดอ่านได้บนเว็บไซต์' },
  logs: { title: 'ประวัติการทำงาน', description: 'บันทึกการแก้ไขของผู้ดูแลระบบทุกคน (50 รายการล่าสุด)' },
};

function AdminContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'news';
  const openNew = searchParams.get('new') === '1';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  const [imagePathsInput, setImagePathsInput] = useState('');
  const [videoFileText, setVideoFileText] = useState('');
  const [pdfFileText, setPdfFileText] = useState('');
  const [socialVideoUrl, setSocialVideoUrl] = useState('');
  const [seriesKey, setSeriesKey] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');

  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(tabParam);
    setSearch('');
  }, [tabParam]);

  useEffect(() => {
    if (activeTab !== 'media') return;
    fetch('/api/cms?category=media')
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => [])
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const uniqueKeys = Array.from(new Set(list.map((item: any) => item.series_key).filter(Boolean))) as string[];
        setSeriesKeys(uniqueKeys.sort());
      });
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const endpoint = activeTab === 'logs' ? '/api/logs' : `/api/cms?category=${activeTab}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(res.status === 403 ? 'คุณไม่มีสิทธิ์เข้าถึงหมวดนี้' : 'เซิร์ฟเวอร์ตอบกลับผิดพลาด');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (activeTab === 'logs') setLogs(list); else setItems(list);
    } catch (error) {
      setItems([]);
      setLogs([]);
      setLoadError(error instanceof Error ? error.message : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // เปิดฟอร์มทันทีเมื่อมาจากปุ่มทางลัดบนหน้าภาพรวม
  useEffect(() => {
    if (!openNew || isLoading) return;
    handleOpenAdd();
    router.replace(`/admin/content?tab=${activeTab}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNew, isLoading]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => String(item.title || '').toLowerCase().includes(keyword));
  }, [items, search]);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return logs;
    return logs.filter((log) =>
      `${log.admin_username} ${log.action} ${log.target_title}`.toLowerCase().includes(keyword));
  }, [logs, search]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setSelectedImageFiles(fileList);
    setImagePathsInput(fileList.map(f => f.name).join(', '));
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedVideoFile(file);
    setVideoFileText(file.name);
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/pdf') {
      setUploadError('ไฟล์ต้องเป็น PDF เท่านั้น');
      setSelectedPdfFile(null);
      setPdfFileText('');
      return;
    }

    setSelectedPdfFile(file);
    setPdfFileText(file.name);
    setUploadError(null);
  };

  const createVideoThumbnail = (file: File) => new Promise<File>((resolve, reject) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, Math.max(0, video.duration - 0.1));
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context || !canvas.width || !canvas.height) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('ไม่สามารถสร้างภาพปกจากวิดีโอได้'));
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error('ไม่สามารถสร้างภาพปกจากวิดีโอได้'));
          return;
        }
        resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-thumbnail.jpg`, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถอ่านวิดีโอเพื่อสร้างภาพปกได้'));
    };
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setTitle('');
    setContent('');
    setEventDate(new Date().toISOString().split('T')[0]);
    setImagePathsInput('');
    setVideoFileText('');
    setPdfFileText('');
    setSocialVideoUrl('');
    setSeriesKey('');
    setEpisodeNumber('');
    setSelectedImageFiles([]);
    setSelectedVideoFile(null);
    setSelectedPdfFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditId(item.id);
    setTitle(item.title);
    setContent(item.content || '');
    setEventDate(item.event_date ? item.event_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setImagePathsInput(Array.isArray(item.image_paths) ? item.image_paths.join(', ') : '');
    setVideoFileText(item.video_file || '');
    setPdfFileText(item.pdf_file || '');
    setSocialVideoUrl(item.social_video_url || '');
    setSeriesKey(item.series_key || '');
    setEpisodeNumber(item.episode_number ? String(item.episode_number) : '');
    setSelectedImageFiles([]);
    setSelectedVideoFile(null);
    setSelectedPdfFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    const formData = new FormData();
    if (editId) formData.append('id', String(editId));
    formData.append('title', title);
    formData.append('category', activeTab);
    formData.append('content', content);
    formData.append('eventDate', eventDate);
    formData.append('socialVideoUrl', socialVideoUrl);
    formData.append('seriesKey', seriesKey);
    formData.append('episodeNumber', episodeNumber);
    formData.append('existingImages', imagePathsInput);
    formData.append('existingVideo', videoFileText);
    formData.append('existingPdf', pdfFileText);

    selectedImageFiles.forEach(file => {
      formData.append('imageFiles', file);
    });

    if (selectedVideoFile) {
      formData.append('videoFile', selectedVideoFile);
      if (activeTab === 'media') {
        try {
          formData.append('imageFiles', await createVideoThumbnail(selectedVideoFile));
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : 'ไม่สามารถสร้างภาพปกจากวิดีโอได้');
          setIsUploading(false);
          return;
        }
      }
    }

    if (selectedPdfFile) {
      formData.append('pdfFile', selectedPdfFile);
    }

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + Math.random() * 30, 90));
    }, 300);

    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok) {
        const wasEditing = editId !== null;
        setTimeout(() => {
          setIsModalOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
          fetchData();
          toast.success(wasEditing ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'เพิ่มข้อมูลใหม่เรียบร้อยแล้ว');
        }, 500);
      } else {
        const result = await res.json().catch(() => ({}));
        const errorMsg = result.error || 'บันทึกข้อมูลและอัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
        setUploadError(errorMsg);
        setIsUploading(false);
        setUploadProgress(0);
      }
    } catch (err) {
      clearInterval(progressInterval);
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลด';
      setUploadError(errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    const response = await fetch(`/api/cms?id=${target.id}`, { method: 'DELETE' });
    if (response.ok) {
      toast.success(`ลบ "${target.title}" เรียบร้อยแล้ว`);
      fetchData();
    } else {
      toast.error('ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const meta = TAB_META[activeTab] ?? TAB_META.news;
  const isLogs = activeTab === 'logs';
  const rowCount = isLogs ? filteredLogs.length : filteredItems.length;
  const totalCount = isLogs ? logs.length : items.length;

  const mediaBadges = (item: any) => (
    <>
      {item.image_paths?.length > 0 && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{item.image_paths.length} รูป</span>}
      {item.video_file && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">MP4</span>}
      {item.pdf_file && <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded text-xs font-bold">PDF</span>}
      {item.social_video_url && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">โซเชียล</span>}
    </>
  );

  return (
    <AdminShell
      activeKey={activeTab}
      title={meta.title}
      description={meta.description}
      actions={!isLogs && (
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition">
          <Plus className="w-4 h-4" /> เพิ่มข้อมูลใหม่
        </button>
      )}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isLogs ? 'ค้นหาจากชื่อผู้ดูแลหรือหัวข้อ...' : 'ค้นหาจากหัวข้อ...'}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition"
            />
          </div>
          <span className="text-sm text-gray-500 shrink-0">
            {search ? `พบ ${rowCount} จาก ${totalCount} รายการ` : `ทั้งหมด ${totalCount} รายการ`}
          </span>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={isLogs ? 4 : 4} />
        ) : loadError ? (
          <ErrorState message={loadError} onRetry={fetchData} />
        ) : rowCount === 0 ? (
          search ? (
            <EmptyState icon={Search} title="ไม่พบรายการที่ค้นหา" description={`ลองค้นหาด้วยคำอื่น หรือล้างคำว่า "${search}"`} />
          ) : isLogs ? (
            <EmptyState icon={History} title="ยังไม่มีประวัติการทำงาน" description="เมื่อมีผู้ดูแลระบบเพิ่มหรือแก้ไขเนื้อหา รายการจะปรากฏที่นี่" />
          ) : (
            <EmptyState
              title={`ยังไม่มี${meta.title}`}
              description="กดปุ่มด้านล่างเพื่อเพิ่มรายการแรก"
              action={
                <button onClick={handleOpenAdd} className="inline-flex items-center gap-2 bg-forest-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition">
                  <Plus className="w-4 h-4" /> เพิ่มข้อมูลใหม่
                </button>
              }
            />
          )
        ) : isLogs ? (
          <>
            <table className="w-full text-left border-collapse text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs">
                  <th className="p-4 font-semibold">ผู้ดูแลระบบ</th>
                  <th className="p-4 font-semibold">การกระทำ</th>
                  <th className="p-4 font-semibold">หัวข้อ</th>
                  <th className="p-4 font-semibold text-right">วันเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 text-xs">
                    <td className="p-4 font-bold text-forest-900">{log.admin_username}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded font-bold bg-gray-100">{log.action}</span></td>
                    <td className="p-4 font-medium text-gray-900">{log.target_title}</td>
                    <td className="p-4 text-right text-gray-500">{new Date(log.created_at).toLocaleString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <li key={log.id} className="p-4 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100">{log.action}</span>
                    <span className="text-xs font-bold text-forest-900">{log.admin_username}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{log.target_title}</p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('th-TH')}</p>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <table className="w-full text-left border-collapse text-sm hidden md:table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs">
                  <th className="p-4 font-semibold">หัวข้อ</th>
                  <th className="p-4 font-semibold">ไฟล์มีเดีย</th>
                  <th className="p-4 font-semibold">วันที่ลงข้อมูล</th>
                  <th className="p-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <FileText className="w-4 h-4 text-forest-600 shrink-0" /> {item.title}
                      </div>
                    </td>
                    <td className="p-4"><div className="flex flex-wrap gap-1">{mediaBadges(item)}</div></td>
                    <td className="p-4 text-gray-500 text-xs">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenEdit(item)} aria-label={`แก้ไข ${item.title}`} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setPendingDelete(item)} aria-label={`ลบ ${item.title}`} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden divide-y divide-gray-50">
              {filteredItems.map((item) => (
                <li key={item.id} className="p-4 space-y-2">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <div className="flex flex-wrap gap-1">{mediaBadges(item)}</div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-gray-500">
                      {item.published_at ? new Date(item.published_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenEdit(item)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium"><Edit className="w-3.5 h-3.5" /> แก้ไข</button>
                      <button onClick={() => setPendingDelete(item)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium"><Trash2 className="w-3.5 h-3.5" /> ลบ</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleSubmit} className="bg-white max-w-xl w-full p-5 sm:p-6 rounded-3xl shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900">{editId ? 'แก้ไขข้อมูล' : `เพิ่ม${meta.title}`}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="ปิด"><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">หัวข้อ / ชื่อเรื่อง</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="กรอกหัวข้อกิจกรรม..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" required />
              </div>

              {activeTab === 'news' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">📅 วันที่จัดกิจกรรม</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500 bg-white" required />
                </div>
              )}

              {activeTab === 'news' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><ImageIcon className="w-4 h-4 text-forest-700" /> ไฟล์รูปภาพ JPG, PNG, WebP (เลือกหลายรูป)</label>
                  <div className="flex gap-2">
                    <textarea value={imagePathsInput} onChange={e => setImagePathsInput(e.target.value)} placeholder="คลิกเรียกดูเพื่อเลือกรูปภาพ..." rows={2} className="flex-1 px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500"></textarea>
                    <input type="file" ref={imageInputRef} onChange={handleImageSelect} multiple accept="image/jpeg,image/png,image/webp" className="hidden" />
                    <button type="button" onClick={() => imageInputRef.current?.click()} className="px-4 bg-forest-700 text-white rounded-xl text-xs font-medium hover:bg-forest-800 transition flex items-center gap-1 shrink-0 h-10">
                      <FolderOpen className="w-4 h-4" /> เรียกดู...
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'media' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Combobox
                    value={seriesKey}
                    onChange={setSeriesKey}
                    options={seriesKeys}
                    placeholder="ค้นหาหรือสร้างกลุ่มใหม่..."
                    label="กลุ่มซีรีส์ (เช่น forest-doc)"
                  />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">หมายเลขตอน</label>
                    <input type="number" min="1" value={episodeNumber} onChange={e => setEpisodeNumber(e.target.value)} placeholder="เช่น 1" className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                </div>
              )}

              {activeTab !== 'publications' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Video className="w-4 h-4 text-forest-700" /> คลิปวิดีโอ MP4 หรือ WebM</label>
                  <div className="flex gap-2">
                    <input type="text" value={videoFileText} onChange={e => setVideoFileText(e.target.value)} placeholder="คลิกเรียกดูเพื่อเลือกไฟล์ .mp4..." className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                    <input type="file" ref={videoInputRef} onChange={handleVideoSelect} accept="video/mp4,video/webm" className="hidden" />
                    <button type="button" onClick={() => videoInputRef.current?.click()} className="px-4 bg-forest-700 text-white rounded-xl text-xs font-medium hover:bg-forest-800 transition flex items-center gap-1 shrink-0 h-10">
                      <FolderOpen className="w-4 h-4" /> เรียกดู...
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'publications' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><FileText className="w-4 h-4 text-blue-600" /> ไฟล์ PDF</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pdfFileText}
                      onChange={e => setPdfFileText(e.target.value)}
                      placeholder="คลิกเรียกดูเพื่อเลือกไฟล์ .pdf..."
                      className="flex-1 px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500"
                      readOnly
                    />
                    <input type="file" ref={pdfInputRef} onChange={handlePdfSelect} accept="application/pdf" className="hidden" />
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 bg-forest-700 text-white rounded-xl text-xs font-medium hover:bg-forest-800 disabled:bg-gray-400 transition flex items-center gap-1 shrink-0 h-10"
                    >
                      <FolderOpen className="w-4 h-4" /> เรียกดู...
                    </button>
                  </div>
                  {selectedPdfFile && (
                    <div className="text-xs text-gray-600 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{selectedPdfFile.name}</span>
                        <span className="text-gray-500">({(selectedPdfFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== 'publications' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Link2 className="w-4 h-4 text-blue-600" /> ลิงก์ YouTube, TikTok, Facebook</label>
                  <input type="text" value={socialVideoUrl} onChange={e => setSocialVideoUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="กรอกรายละเอียด..." rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500"></textarea>
              </div>

              {uploadError && (
                <div className="text-xs text-red-700 px-3 py-2.5 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {uploadError}
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-700">
                    <Loader className="w-3.5 h-3.5 animate-spin text-forest-700" />
                    <span>กำลังบันทึกข้อมูล... {Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-forest-600 to-forest-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-forest-700 text-white rounded-xl text-sm font-medium hover:bg-forest-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {isUploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>บันทึกข้อมูล</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="ลบรายการนี้?"
        description={pendingDelete ? `"${pendingDelete.title}" จะถูกลบออกจากเว็บไซต์ถาวร และไม่สามารถกู้คืนได้` : undefined}
        confirmLabel="ลบถาวร"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminShell>
  );
}

export default function AdminCMSPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">กำลังโหลด...</div>}>
      <AdminContentInner />
    </Suspense>
  );
}
