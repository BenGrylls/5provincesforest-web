import { Award, CalendarDays, MapPin } from 'lucide-react';

type BiographySection = { title: string; content: string };
type President = { name: string; position: string; image_path?: string; biography?: string; responsibilities?: string; biography_sections?: BiographySection[] };

const referenceSections: BiographySection[] = [
  { title: 'ข้อมูลส่วนตัว', content: 'วันเกิด: ๑๑ สิงหาคม ๒๔๘๘\nที่อยู่ปัจจุบัน: กรุงเทพมหานคร' },
  { title: 'ประวัติการศึกษา', content: 'พ.ศ. ๒๕๐๕ โรงเรียนเซนต์คาเบรียล\nพ.ศ. ๒๕๐๘ โรงเรียนเตรียมทหาร รุ่นที่ ๖\nพ.ศ. ๒๕๑๒ โรงเรียนนายร้อยพระจุลจอมเกล้า รุ่นที่ ๑๗\nพ.ศ. ๒๕๒๑ โรงเรียนเสนาธิการทหารบก หลักสูตรหลักประจำ ชุดที่ ๕๖\nพ.ศ. ๒๕๔๐ วิทยาลัยป้องกันราชอาณาจักร รุ่นที่ ๔๐' },
  { title: 'ประวัติการรับราชการและตำแหน่งสำคัญ', content: 'ยศทหาร: ร้อยตรี, ร้อยโท, ร้อยเอก, พันตรี, พันโท, พันเอก, พลตรี, พลโท และพลเอก\nตำแหน่งสำคัญ: รองแม่ทัพภาคที่ ๑, แม่ทัพน้อยที่ ๑, แม่ทัพภาคที่ ๑, ผู้ช่วยผู้บัญชาการทหารบก และผู้บัญชาการทหารบก' },
  { title: 'ราชการสนามและภารกิจพิเศษ', content: 'ปฏิบัติราชการพิเศษและราชการสนามชายแดน รวมถึงภารกิจด้านความมั่นคงและการพัฒนาพื้นที่ชายแดนไทย-กัมพูชา' },
  { title: 'เครื่องราชอิสริยาภรณ์และเหรียญราชการพิเศษ', content: 'เหรียญชัยสมรภูมิ, เหรียญราชการชายแดน, ตริตาภรณ์มงกุฎไทย, เหรียญพิทักษ์เสรีชน ชั้น ๑, มหาวชิรมงกุฎ และมหาปรมาภรณ์ช้างเผือก' },
];

export default function ChairmanProfile({ president }: { president: President }) {
  const savedSections = president.biography_sections?.filter((section) => section.title && section.content) || [];
  const sections = savedSections.length ? savedSections : referenceSections;
  const personal = sections.find((section) => section.title.includes('ข้อมูลส่วนตัว'));
  const profileSections = sections.filter((section) => section !== personal);

  return <div className="max-w-6xl mx-auto px-4 py-10 md:py-14 w-full">
    <section className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
      <div className="bg-forest-950 px-6 py-10 md:px-10 text-white"><div className="flex flex-col md:flex-row md:items-center gap-7"><div className="w-40 h-52 md:w-48 md:h-60 shrink-0 bg-earth-200 border-4 border-white/20 rounded-lg overflow-hidden">{president.image_path ? <img src={president.image_path} alt={president.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-center p-4 text-sm text-earth-600">ภาพ พลเอก ประวิตร วงษ์สุวรรณ</div>}</div><div className="space-y-3"><p className="text-sm text-amber-300 font-medium">ประธานมูลนิธิอนุรักษ์ป่ารอยต่อ ๕ จังหวัด</p><h1 className="text-3xl md:text-5xl font-bold leading-tight">{president.name}</h1><p className="text-lg text-earth-100">{president.position}</p>{president.biography && <p className="max-w-2xl text-sm leading-7 text-white/85">{president.biography}</p>}</div></div></div>
      {personal && <div className="grid md:grid-cols-2 gap-px bg-gray-100"><div className="bg-white p-5 flex gap-3"><CalendarDays className="w-5 h-5 text-forest-700 shrink-0" /><div><p className="text-xs text-gray-500">ข้อมูลส่วนตัว</p><p className="mt-1 text-sm text-earth-800 whitespace-pre-line">{personal.content.split('\n')[0]}</p></div></div><div className="bg-white p-5 flex gap-3"><MapPin className="w-5 h-5 text-forest-700 shrink-0" /><div><p className="text-xs text-gray-500">ที่อยู่</p><p className="mt-1 text-sm text-earth-800 whitespace-pre-line">{personal.content.split('\n').slice(1).join('\n') || '-'}</p></div></div></div>}
    </section>
    <div className="mt-8 grid lg:grid-cols-[13rem_minmax(0,1fr)] gap-8"><aside className="hidden lg:block"><nav className="sticky top-24 bg-white border border-gray-100 rounded-xl p-4"><p className="font-bold text-forest-950 mb-3">เนื้อหาประวัติ</p>{profileSections.map((section, index) => <a key={section.title} href={`#section-${index}`} className="block py-2 text-sm text-earth-700 hover:text-forest-700">{section.title}</a>)}</nav></aside><div className="space-y-4">{profileSections.map((section, index) => { const entries = section.content.split('\n').map((entry) => entry.trim()).filter(Boolean); return <details id={`section-${index}`} key={section.title} open={index === 0} className="group bg-white border border-gray-100 rounded-xl scroll-mt-24"><summary className="cursor-pointer list-none flex items-center gap-3 p-5 font-bold text-forest-950"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-50 text-xs text-forest-700">{index + 1}</span>{section.title}<span className="ml-auto text-forest-600 group-open:rotate-45 transition-transform text-xl">+</span></summary><div className="px-5 pb-6 pt-1 md:ml-14"><ul className="space-y-3">{entries.map((entry, entryIndex) => <li key={`${entryIndex}-${entry}`} className="flex gap-3 font-serif leading-7 text-earth-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500" />{entry}</li>)}</ul></div></details>; })}{president.responsibilities && <section className="bg-forest-50 border border-forest-100 rounded-xl p-6"><div className="flex items-center gap-3"><Award className="w-5 h-5 text-forest-700" /><h2 className="font-bold text-forest-950">วิสัยทัศน์และภารกิจสำคัญ</h2></div><p className="mt-4 whitespace-pre-line font-serif leading-8 text-earth-700">{president.responsibilities}</p></section>}</div></div>
  </div>;
}
