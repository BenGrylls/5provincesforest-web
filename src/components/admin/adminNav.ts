import {
  BookOpen,
  Film,
  History,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Newspaper,
  Settings,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * นิยามเมนู admin ไว้ที่เดียว
 *
 * เดิม sidebar ถูก copy ไว้ในทุกหน้า (admin, content, sub-admins, settings) แล้วค่อยๆ
 * เพี้ยนจากกัน เช่นหน้า sub-admins/settings ไม่เช็คสิทธิ์เลย sub-admin จึงเห็นเมนู
 * ที่ตัวเองกดเข้าไปไม่ได้ และสองหน้านั้นก็ไม่มีเมนูเปลี่ยนรหัสผ่าน
 */

export type NavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  /** ชื่อสิทธิ์ใน sub_admins.permissions — ไม่ระบุ = ทุกคนเข้าได้ */
  permission?: string;
  superOnly?: boolean;
};

export type NavGroup = {
  key: string;
  label?: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    items: [
      { key: 'overview', label: 'ภาพรวมระบบ', icon: LayoutDashboard, href: '/admin' },
    ],
  },
  {
    key: 'content',
    label: 'จัดการเนื้อหาเว็บไซต์',
    items: [
      { key: 'history', label: 'ประวัติความเป็นมา', icon: Landmark, href: '/admin/history', permission: 'ประวัติความเป็นมา' },
      { key: 'objectives', label: 'วัตถุประสงค์และภารกิจ', icon: Target, href: '/admin/objectives', permission: 'วัตถุประสงค์และภารกิจ' },
      { key: 'news', label: 'กิจกรรมและประชาสัมพันธ์', icon: Newspaper, href: '/admin/content?tab=news', permission: 'ข่าวสารและกิจกรรม' },
      { key: 'media', label: 'สื่อและสารคดีธรรมชาติ', icon: Film, href: '/admin/content?tab=media', permission: 'สื่อและสารคดีธรรมชาติ' },
      { key: 'publications', label: 'คลังเอกสารและวารสาร', icon: BookOpen, href: '/admin/content?tab=publications', permission: 'คลังเอกสารและวารสาร' },
      { key: 'committee', label: 'โครงสร้างคณะกรรมการ', icon: Users, href: '/admin/committee', permission: 'โครงสร้างคณะกรรมการ' },
      { key: 'logs', label: 'ประวัติการทำงาน (Logs)', icon: History, href: '/admin/content?tab=logs', superOnly: true },
    ],
  },
  {
    key: 'system',
    label: 'ตั้งค่าระบบ',
    items: [
      { key: 'sub-admins', label: 'จัดการสิทธิ์ Sub-Admin', icon: Users, href: '/admin/sub-admins', superOnly: true },
      { key: 'settings', label: 'ธีมสีและ Cover วันสำคัญ', icon: Settings, href: '/admin/settings', superOnly: true },
      { key: 'change-password', label: 'เปลี่ยนรหัสผ่าน', icon: KeyRound, href: '/admin/change-password' },
    ],
  },
];

export function canSee(item: NavItem, isSuperAdmin: boolean, permissions: string[]) {
  if (isSuperAdmin) return true;
  if (item.superOnly) return false;
  if (!item.permission) return true;
  return permissions.includes(item.permission);
}

export function visibleGroups(isSuperAdmin: boolean, permissions: string[]) {
  return NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => canSee(item, isSuperAdmin, permissions)) }))
    .filter((group) => group.items.length > 0);
}
