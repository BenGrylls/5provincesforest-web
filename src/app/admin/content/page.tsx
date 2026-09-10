'use client';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, Plus, Trash2, Edit, X, Save, History, Newspaper, Film, BookOpen, Users, LogOut, ChevronDown, ChevronUp, Image as ImageIcon, Video, Link2, FolderOpen, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Combobox from '@/components/Combobox';

function AdminContentInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') || 'news';

  const [activeTab, setActiveTab] = useState(tabParam);
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isContentOpen, setIsContentOpen] = useState(true);
  
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
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const [permissions, setPermissions] = useState<string[] | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((response) => response.ok ? response.json() : null)
      .then((session) => {
        setIsSuperAdmin(session?.role !== 'sub_admin');
        if (Array.isArray(session?.permissions)) setPermissions(session.permissions);
      });
  }, []);

  const canManage = (permission: string) => isSuperAdmin || permissions?.includes(permission);

  useEffect(() => {
    if (activeTab === 'media') {
      const fetchSeriesKeys = async () => {
        try {
          const res = await fetch('/api/cms?category=media');
          const responseData = res.ok ? await res.json() : [];
          const data = Array.isArray(responseData) ? responseData : [];
          const uniqueKeys = Array.from(
            new Set(data.map((item: any) => item.series_key).filter((key: string | null): key is string => key !== null))
          ) as string[];
          setSeriesKeys(uniqueKeys.sort());
        } catch (e) {
          setSeriesKeys([]);
        }
      };
      fetchSeriesKeys();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'logs') {
        const res = await fetch('/api/logs');
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        const res = await fetch(`/api/cms?category=${activeTab}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setItems([]);
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    router.push(`/admin/content?tab=${tab}`);
  };

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
    
    // Validate file type
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

    // Simulate progress for better UX
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
        setTimeout(() => {
          setIsModalOpen(false);
          setIsUploading(false);
          setUploadProgress(0);
          fetchData();
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

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบข้อมูลนี้ใช่หรือไม่?')) return;
    await fetch(`/api/cms?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      <aside className="w-72 bg-forest-950 text-white flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-forest-900">
          <h2 className="font-bold text-lg">Admin Control</h2>
          <p className="text-xs text-forest-300">ระบบจัดการมูลนิธิป่ารอยต่อฯ</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 text-sm overflow-y-auto">
          <a href="/admin" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300 transition">ภาพรวมระบบ</a>
          
          <div>
            <button 
              onClick={() => setIsContentOpen(!isContentOpen)} 
              className="w-full flex items-center justify-between px-4 py-2.5 bg-forest-900 rounded-xl font-medium text-white transition"
            >
              <span>จัดการเนื้อหาเว็บไซต์</span>
              {isContentOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {isContentOpen && (
              <div className="ml-4 mt-1 pl-3 border-l border-forest-800 space-y-1 text-xs">
                {canManage('ข่าวสารและกิจกรรม') && <button onClick={() => handleTabChange('news')} className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'news' ? 'bg-forest-800 text-white font-bold' : 'text-gray-300 hover:bg-forest-900/40'}`}>
                  <Newspaper className="w-3.5 h-3.5 text-amber-400" /> กิจกรรมและประชาสัมพันธ์
                </button>}
                {canManage('สื่อและสารคดีธรรมชาติ') && <button onClick={() => handleTabChange('media')} className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'media' ? 'bg-forest-800 text-white font-bold' : 'text-gray-300 hover:bg-forest-900/40'}`}>
                  <Film className="w-3.5 h-3.5 text-amber-400" /> สื่อและสารคดีธรรมชาติ
                </button>}
                {canManage('คลังเอกสารและวารสาร') && <button onClick={() => handleTabChange('publications')} className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'publications' ? 'bg-forest-800 text-white font-bold' : 'text-gray-300 hover:bg-forest-900/40'}`}>
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> คลังเอกสารและวารสาร
                </button>}
                {canManage('โครงสร้างคณะกรรมการ') && <a href="/admin/committee" className="w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 text-gray-300 hover:bg-forest-900/40">
                  <Users className="w-3.5 h-3.5 text-amber-400" /> จัดการโครงสร้างคณะกรรมการ
                </a>}
                {isSuperAdmin && <button onClick={() => handleTabChange('logs')} className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${activeTab === 'logs' ? 'bg-amber-900/80 text-white font-bold' : 'text-gray-300 hover:bg-forest-900/40'}`}>
                  <History className="w-3.5 h-3.5 text-amber-400" /> ประวัติการทำงาน (Logs)
                </button>}
              </div>
            )}
          </div>

          {isSuperAdmin && <a href="/admin/sub-admins" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">จัดการสิทธิ์ Sub-Admin</a>}
          <a href="/admin/change-password" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">เปลี่ยนรหัสผ่าน</a>
          {isSuperAdmin && <a href="/admin/settings" className="block px-4 py-2.5 hover:bg-forest-900/50 rounded-xl text-gray-300">ตั้งค่าธีมสีและไว้อาลัย</a>}
        </nav>
        <div className="p-4 border-t border-forest-900">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 px-4 py-2 bg-red-950/30 rounded-xl transition">
            <LogOut className="w-4 h-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-5xl mx-auto space-y-8 overflow-y-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === 'news' && '📢 กิจกรรมและประชาสัมพันธ์'}
              {activeTab === 'media' && '🎬 สื่อและสารคดีธรรมชาติ'}
              {activeTab === 'publications' && '📚 คลังเอกสารและวารสาร'}
              {activeTab === 'logs' && '🕒 ประวัติการทำงาน (Admin Audit Logs)'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">จัดการเนื้อหาพร้อมอัปโหลดไฟล์จริงขึ้นเซิร์ฟเวอร์</p>
          </div>
          <a href="/admin" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">← ภาพรวมระบบ</a>
        </div>

        {activeTab !== 'logs' && (
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
            <span className="text-sm font-semibold text-gray-700">รายการทั้งหมด ({items.length})</span>
            <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-forest-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-forest-800 transition">
              <Plus className="w-4 h-4" /> เพิ่มข้อมูลใหม่
            </button>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <form onSubmit={handleSubmit} className="bg-white max-w-xl w-full p-6 rounded-3xl shadow-xl space-y-4 my-8">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-gray-900">{editId ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><ImageIcon className="w-4 h-4 text-forest-700" /> ไฟล์รูปภาพ JPG, PNG, WebP (เลือกหลายรูป)</label>
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
                  <div className="grid grid-cols-2 gap-3">
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Video className="w-4 h-4 text-forest-700" /> คลิปวิดีโอ MP4 หรือ WebM</label>
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
                    <label className="block text-xs font-semibold text-gray-600 flex items-center gap-1"><FileText className="w-4 h-4 text-blue-600" /> ไฟล์ PDF</label>
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
                    {uploadError && (
                      <div className="text-xs text-red-700 px-3 py-2 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {uploadError}
                      </div>
                    )}
                  </div>
                )}

                {activeTab !== 'publications' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1"><Link2 className="w-4 h-4 text-blue-600" /> ลิงก์ YouTube, TikTok, Facebook</label>
                    <input type="text" value={socialVideoUrl} onChange={e => setSocialVideoUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">รายละเอียดเพิ่มเติม</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="กรอกรายละเอียด..." rows={3} className="w-full px-4 py-2.5 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-forest-500"></textarea>
                </div>

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
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="flex items-center gap-1 px-5 py-2 bg-forest-700 text-white rounded-xl text-xs font-medium hover:bg-forest-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
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

        {activeTab !== 'logs' ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <th className="p-4">หัวข้อ</th>
                  <th className="p-4">ไฟล์มีเดีย</th>
                  <th className="p-4">วันที่ลงข้อมูล</th>
                  <th className="p-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-forest-600 shrink-0" /> {item.title}
                    </td>
                    <td className="p-4 text-xs space-x-1">
                      {item.image_paths && item.image_paths.length > 0 && <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold">{item.image_paths.length} รูป</span>}
                      {item.video_file && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">MP4</span>}
                      {item.pdf_file && <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>}
                      {item.social_video_url && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold">โซเชียล</span>}
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {item.published_at ? new Date(item.published_at).toLocaleString('th-TH') : '-'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <th className="p-4">ผู้ดูแลระบบ</th>
                  <th className="p-4">การกระทำ</th>
                  <th className="p-4">หัวข้อ</th>
                  <th className="p-4 text-right">วันเวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 text-xs">
                    <td className="p-4 font-bold text-forest-900">{log.admin_username}</td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded font-bold bg-gray-100">{log.action}</span></td>
                    <td className="p-4 font-medium text-gray-900">{log.target_title}</td>
                    <td className="p-4 text-right text-gray-500">{new Date(log.created_at).toLocaleString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminCMSPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <AdminContentInner />
    </Suspense>
  );
}
