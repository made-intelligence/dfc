"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Linkedin,
  Globe,
  Stethoscope,
  GraduationCap,
  Users,
  Heart,
  Shield,
  Lightbulb,
  ArrowRight,
  Building2,
  HandshakeIcon,
  Target,
  X,
} from "lucide-react";

interface LeadershipProfile {
  id: string;
  name: string;
  title: string | null;
  group: string;
  role: string | null;
  bio: string | null;
  imageUrl: string | null;
  linkedinUrl: string | null;
  institution: string | null;
  location: string | null;
}

const FALLBACK_GROUPS: Record<string, LeadershipProfile[]> = {
  FOUNDER: [
    {
      id: "f1", name: "Dr. Babaseyi Oyesola", title: "Founder", group: "FOUNDER",
      role: "Founder", bio: null, imageUrl: "/team/oyesola.jpg", linkedinUrl: null,
      institution: "Consultant Anaesthesiologist · A3C", location: "United Kingdom",
    },
  ],
  EXCO: [
    { id: "e1", name: "Dr. Debo Odulana", title: "President", group: "EXCO", role: "President", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
    { id: "e2", name: "Dr. Folake Kofo-Idowu", title: "Vice President", group: "EXCO", role: "Vice President", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
    { id: "e3", name: "Prof. Abdul Kareem Lateef", title: "Treasurer", group: "EXCO", role: "Treasurer", bio: null, imageUrl: null, linkedinUrl: null, institution: null, location: null },
  ],
  BOT: [
    {
      id: "b1",
      name: "Dr. Babaseyi O. Oyesola",
      title: "Consultant Anaesthesiologist & Critical Care Specialist",
      group: "BOT",
      role: "Chairman, Board of Trustees",
      institution: "Founder & Managing Partner, A3C",
      location: "United Kingdom",
      imageUrl: "/team/oyesola.jpg",
      linkedinUrl: null,
      bio: "Dr. Babaseyi Oyesola is a Consultant Anaesthesiologist and Critical Care Specialist with over 30 years of practice, 16 of them in the NHS in the United Kingdom. He is the Founder and Managing Partner of Anaesthesia and Critical Care Consultants (A3C), where he leads service provision and clinical excellence in anaesthesia and intensive care.\n\nHe has held senior roles including Chief Medical Director at Delta State University Teaching Hospital (DELSUTH) and Consultant at Medway Hospital, Kent. He is actively involved in medical education and simulation training, having taught at institutions such as Imperial College School of Medicine, London, and UCLA in California.\n\nHis passion for leveraging diaspora medical expertise to strengthen healthcare delivery and outcomes in Nigeria inspired him to found the Doctors Foundation for Care, and he has served as Chairman of the Board of Trustees since its inception.",
    },
    {
      id: "b2",
      name: "Dr. Ikechukwu Augustine Nwachukwu",
      title: "FRCS (Eng), FRCS (Tr & Orth)",
      group: "BOT",
      role: "Consultant Trauma & Orthopaedic Surgeon",
      institution: "Co-Founder & CEO, Nikea Specialist Hospital",
      location: "Enugu & Lagos, Nigeria",
      imageUrl: "/team/nwachukwu.jpg",
      linkedinUrl: null,
      bio: "Dr. Ikechukwu Nwachukwu is a Consultant Trauma & Orthopaedic Surgeon with over 30 years of global medical experience across Nigeria, the United Kingdom, the United States, and Australia. He is dual-qualified in general and specialist orthopaedics (FRCS Eng, FRCS Tr & Orth), with advanced fellowships in Trauma (Boston, USA) and Sports & Upper Limb Surgery (Melbourne, Australia).\n\nHe is Co-Founder and CEO of Nikea Specialist Hospital, with branches in Enugu and Lagos, delivering world-class orthopaedic and trauma care in Nigeria. He is recognised for combining clinical excellence with leadership in medical training and healthcare system development, and is a committed advocate of medical diaspora partnerships and healthcare access across Africa.\n\nOutside medicine, he is a keen gardener, a chef, a hobbyist drone pilot, and a mountaineer who summited Mount Kilimanjaro in 2024.",
    },
    {
      id: "b3",
      name: "Dr. Iheanacho Emeruwa",
      title: "MD, FACP, FACOG",
      group: "BOT",
      role: "Internal Medicine & Obstetrics / Gynaecology",
      institution: "President & CEO, Aspen Medical Group",
      location: "California, USA",
      imageUrl: "/team/emeruwa.jpg",
      linkedinUrl: null,
      bio: "Dr. Iheanacho Emeruwa is a physician-leader with a career spanning internal medicine, obstetrics and gynaecology, emergency medicine, and healthcare administration. He serves as President and CEO of Aspen Medical Group, Inc., as CEO and President of Circle City Midwifery and Women's Healthcare Services, and as Chairman of the African Primary Healthcare Foundation. He is the Founder and first Executive Director of the Association of Nigerian Physicians in the Americas (ANPA).\n\nHe earned his medical degree from Howard University College of Medicine, where he was inducted into the Alpha Omega Alpha Honor Medical Society, and holds a B.S. in Chemistry from Edinboro State College (Summa Cum Laude). He completed residencies in both Internal Medicine and Obstetrics & Gynaecology, with additional fellowship training in Perinatology.\n\nHe is a Fellow of the American College of Physicians and the American College of Obstetricians and Gynecologists, and remains active in mentoring, nonprofit leadership, and global health.",
    },
    {
      id: "b4",
      name: "Dr. Joanna Umo-Etuk (Coker)",
      title: null,
      group: "BOT",
      role: "Consultant Paediatric Anaesthetist",
      institution: "Barking, Havering & Redbridge University Trust",
      location: "London, United Kingdom",
      imageUrl: "/team/umo-etuk.jpg",
      linkedinUrl: null,
      bio: "Dr. Joanna Umo-Etuk graduated from the University of Benin and undertook postgraduate training in Anaesthesia at the Lagos University Teaching Hospital (LUTH), under the renowned Professor Dorothy Ffoulkes-Crabbe. She obtained the Diploma in Anaesthesia and completed the National and West African fellowship examinations.\n\nIn 1990 she moved to the United Kingdom, training in premier London teaching hospitals including Hammersmith, Charing Cross, Chelsea and Westminster, Mount Vernon (Burns and Plastics), and Harefield Cardiothoracic Hospital, where she had the honour of operating alongside Professor Sir Magdi Yacoub.\n\nShe was appointed Consultant and subspecialist Paediatric Anaesthetist at Oldchurch in 2002, now part of the Barking, Havering and Redbridge University Trust (BHRUT), which serves a population of 800,000. She has been a member of DFC from its inception.",
    },
    {
      id: "b5",
      name: "Dr. Andrew Agun",
      title: "MB.BS, DFSRH, MRCOG",
      group: "BOT",
      role: "General Practitioner & Obstetrician / Gynaecologist",
      institution: null,
      location: "United Kingdom",
      imageUrl: "/team/agun.jpg",
      linkedinUrl: null,
      bio: "Dr. Andrew Agun is a General Practitioner and Obstetrician & Gynaecologist. He qualified MB.BS in 1986 and trained as an obstetrician and gynaecologist in the United Kingdom, obtaining the DFSRH in 1995 and the MRCOG in 1996. In 1997 he undertook VTS training to become a GP, working as a GP partner for almost 13 years, and remains committed to contributing to healthcare delivery in Nigeria and other parts of Africa.\n\nIn 2018 he set up a health-focused nonprofit and raised funds that enabled a UK-based podiatrist to travel to Lagos and train 12 nurses and 5 community pharmacists in basic footcare for people living with diabetes. The programme has since grown to four podiatrists annually, expanding access to specialised footcare across the community.\n\nHis passion for improving the healthcare space in Nigeria has found expression in DFC, where he has served on the Board since its inception.",
    },
  ],
};

const GROUP_LABELS: Record<string, { title: string; description: string }> = {
  FOUNDER: { title: "Founder", description: "" },
  EXCO: {
    title: "Executive Committee",
    description: "The EXCO manages the day-to-day affairs of DFC, implements General Assembly resolutions, and coordinates member activities.",
  },
  BOT: {
    title: "Board of Trustees",
    description: "The Board of Trustees holds DFC property, oversees constitutional compliance, and safeguards the organisation\u2019s long-term interests.",
  },
};

function initialsOf(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(" ")
    .filter((w) => w && !/^(Dr\.?|Prof\.?|Mr\.?|Mrs\.?|Ms\.?)$/i.test(w))
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Avatar({ person, size }: { person: LeadershipProfile; size: number }) {
  const [failed, setFailed] = useState(false);
  if (person.imageUrl && !failed) {
    return (
      <Image
        src={person.imageUrl}
        alt={person.name}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#0D1F3C] to-[#0A6E75] flex items-center justify-center">
      <span className="text-white font-bold" style={{ fontSize: size * 0.3 }}>
        {initialsOf(person.name)}
      </span>
    </div>
  );
}

function PersonCard({
  person,
  onOpen,
}: {
  person: LeadershipProfile;
  onOpen: (p: LeadershipProfile) => void;
}) {
  const showCredentials = person.title && person.title !== person.role;
  return (
    <div className="group relative w-full max-w-[16rem]">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 text-center">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mx-auto mb-4 ring-1 ring-gray-200 shadow-sm">
          <Avatar person={person} size={112} />
        </div>
        <h3 className="text-base font-bold text-[#0D1F3C] leading-snug">{person.name}</h3>
        {showCredentials && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mt-1">
            {person.title}
          </p>
        )}
        {person.role && (
          <p className="text-sm font-medium text-[#0A6E75] mt-1.5">{person.role}</p>
        )}
        {person.institution && (
          <p className="text-sm text-gray-500 mt-0.5 leading-snug">{person.institution}</p>
        )}
        {person.location && (
          <p className="text-xs text-gray-400 mt-1">{person.location}</p>
        )}
        {(person.bio || person.linkedinUrl) && (
          <div className="mt-auto pt-4 flex items-center justify-center gap-3">
            {person.bio && (
              <button
                onClick={() => onOpen(person)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#0A6E75] hover:text-[#0D1F3C] transition-colors min-h-[44px]"
              >
                Read full profile
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${person.name} on LinkedIn`}
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#0A6E75] hover:bg-gray-50 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileModal({
  person,
  onClose,
}: {
  person: LeadershipProfile;
  onClose: () => void;
}) {
  const showCredentials = person.title && person.title !== person.role;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${person.name}`}
    >
      <div
        className="absolute inset-0 bg-[#0D1F3C]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close profile"
          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-7 sm:p-9">
          <div className="flex items-center gap-4 mb-5 pr-10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm shrink-0">
              <Avatar person={person} size={80} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0D1F3C] leading-tight">{person.name}</h3>
              {showCredentials && (
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mt-1">
                  {person.title}
                </p>
              )}
              {person.role && (
                <p className="text-sm font-medium text-[#0A6E75] mt-1">{person.role}</p>
              )}
            </div>
          </div>
          {(person.institution || person.location) && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
              {person.institution && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  {person.institution}
                </span>
              )}
              {person.location && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  {person.location}
                </span>
              )}
            </div>
          )}
          {person.bio && (
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
              {person.bio}
            </p>
          )}
          {person.linkedinUrl && (
            <a
              href={person.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0A6E75] hover:underline"
            >
              <Linkedin className="w-4 h-4" />
              Connect on LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function About() {
  const [leadership, setLeadership] =
    useState<Record<string, LeadershipProfile[]>>(FALLBACK_GROUPS);
  const [selected, setSelected] = useState<LeadershipProfile | null>(null);

  useEffect(() => {
    fetch("/api/public/leadership")
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles && Object.keys(data.profiles).length > 0) {
          setLeadership(data.profiles);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected]);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1F3C] via-[#0A3454] to-[#0A6E75]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-20 lg:pt-40 lg:pb-28 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
            Turning Brain Drain
            <br />
            <span className="text-emerald-300">
              Into Brain Gain
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
            A global movement of Nigerian diaspora physicians reconnecting
            with patients at home through world-class care.
          </p>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            {[
              { icon: Stethoscope, label: "Diaspora Specialists" },
              { icon: Globe, label: "7+ Countries" },
              { icon: Users, label: "Growing Network" },
            ].map((stat) => (
              <div key={stat.label} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-2.5">
                <stat.icon className="w-4 h-4 text-emerald-400/80" />
                <span className="text-sm font-medium text-white/80">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who We Are — Glass cards ──────────────────────── */}
      <section className="relative py-20 sm:py-24 bg-[#F8F9FB]">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Who we are</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              The Doctors Foundation For Care
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8">
              <p className="text-base text-gray-700 leading-relaxed">
                Doctors Foundation For Care (Doctors for Change) is a collective of
                physicians who have trained outside Nigeria and are passionate
                about improving Nigeria&apos;s healthcare system. We are a global
                healthcare movement created to bridge the gap between Nigerians
                and the wealth of medical expertise across the world.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mt-4">
                As thousands of our brightest doctors leave the country to pursue
                residency and specialist training abroad, a gap has grown in
                Nigeria&apos;s healthcare system. DFC was built to bridge that
                gap &mdash; reconnecting foreign-trained Nigerian doctors with patients
                back home who still need their expertise, compassion, and care.
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-8">
              <p className="text-base text-gray-700 leading-relaxed">
                At DFC, we believe in the power of collaboration to revolutionise
                healthcare in Nigeria. We focus on facilitating access to
                innovative medical technologies, advanced techniques, and essential
                training. Through this collaborative effort, DFC is committed to
                delivering superior healthcare, driving systemic improvements, and
                enhancing health outcomes across the nation.
              </p>
              <p className="text-base text-gray-700 leading-relaxed mt-4">
                DFC is constituted as a professional body with a General Assembly,
                Executive Committee, and Board of Trustees. It is governed by a
                written constitution and funded by membership dues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mission & Vision — Glass morphism cards ────────── */}
      <section className="relative py-20 sm:py-24 bg-gradient-to-b from-[#F8F9FB] to-white overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {/* Mission */}
            <div className="relative bg-gradient-to-br from-[#0D1F3C] to-[#0A3454] rounded-3xl p-8 overflow-hidden">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-5">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-base text-white/70 leading-relaxed">
                  To lead the advancement of medical practice in Nigeria,
                  facilitating access to innovative medical technologies, advanced
                  techniques, and training to deliver superior healthcare and
                  enhance health outcomes for all.
                </p>
              </div>
            </div>
            {/* Vision */}
            <div className="relative bg-gradient-to-br from-[#0A6E75] to-[#0A3454] rounded-3xl p-8 overflow-hidden">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-5">
                  <Lightbulb className="w-6 h-6 text-emerald-300" />
                </div>
                <h2 className="text-xl font-bold text-white mb-4">Our Vision</h2>
                <p className="text-base text-white/70 leading-relaxed">
                  A future where Nigeria&apos;s healthcare system is a beacon of
                  excellence, innovation, and equitable care, empowered by
                  DFC&apos;s collaborative network of diaspora and local physicians.
                </p>
              </div>
            </div>
          </div>

          {/* What we do */}
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">What we do</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              Why DFC Matters
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Nigeria&apos;s healthcare system is under immense strain, with
              limited specialists, long wait times, and preventable deaths. Yet the
              solution already exists within our own global medical community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Globe, title: "Bridge the brain drain", text: "We turn brain drain into brain gain by reconnecting foreign-trained Nigerian doctors with their home country.", color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 text-blue-600" },
              { icon: Stethoscope, title: "Empower diaspora specialists", text: "We make it easy for Nigerian doctors abroad to consult, mentor, and impact care delivery from anywhere.", color: "from-teal-500 to-emerald-600", bg: "bg-teal-50 text-teal-600" },
              { icon: Lightbulb, title: "Innovative technologies", text: "We facilitate access to innovative medical technologies and advanced techniques that improve patient outcomes.", color: "from-amber-500 to-orange-600", bg: "bg-amber-50 text-amber-600" },
              { icon: Heart, title: "Rebuild trust in care", text: "We are building towards a future where Nigeria\u2019s healthcare system is a beacon of excellence and equitable care.", color: "from-rose-500 to-pink-600", bg: "bg-rose-50 text-rose-600" },
              { icon: Shield, title: "Policy and advocacy", text: "Technical working groups developing policy frameworks, including the Emergency Response Initiative.", color: "from-violet-500 to-purple-600", bg: "bg-violet-50 text-violet-600" },
              { icon: GraduationCap, title: "Training and mentorship", text: "Hands-on fellowships and essential training for Nigerian doctors, led by experienced diaspora specialists.", color: "from-cyan-500 to-sky-600", bg: "bg-cyan-50 text-cyan-600" },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-6"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Diaspora Doctors ───────────────────────────── */}
      <section className="relative py-20 sm:py-24 bg-[#F8F9FB] overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">For diaspora doctors</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C] leading-tight">
              Your Expertise. Your Roots. Your Impact.
            </h2>
            <p className="mt-4 text-base text-gray-600 max-w-xl mx-auto">
              For diaspora doctors, DFC is a movement of return and
              reconnection &mdash; a way to give back meaningfully.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Heart, title: "Reconnect with home", text: "Give back to Nigeria while staying fully engaged in your international career.", gradient: "from-rose-500 to-pink-500" },
              { icon: Globe, title: "Consult without borders", text: "Offer teleconsultations, mentorship, and second opinions from anywhere, on your schedule.", gradient: "from-blue-500 to-indigo-500" },
              { icon: Building2, title: "Earn meaningfully", text: "Generate income for your time and expertise while contributing to a mission that matters.", gradient: "from-emerald-500 to-teal-500" },
              { icon: Users, title: "Expand your reach", text: "Build your personal brand and professional network across continents.", gradient: "from-violet-500 to-purple-500" },
              { icon: HandshakeIcon, title: "Collaborate with peers", text: "Join a trusted community of Nigerian specialists creating solutions for homegrown challenges.", gradient: "from-amber-500 to-orange-500" },
              { icon: GraduationCap, title: "Turn brain drain into legacy", text: "Be part of the generation redefining Nigerian healthcare for the better.", gradient: "from-cyan-500 to-sky-500" },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
              >
                <div className={`h-1 bg-gradient-to-r ${item.gradient}`} />
                <div className="p-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-[#0D1F3C] mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Leadership ─────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#0A6E75] uppercase tracking-wider mb-3">Our people</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1F3C]">
              Leadership
            </h2>
            <p className="mt-3 text-base text-gray-600 max-w-lg mx-auto">
              The people who govern and run DFC.
            </p>
          </div>

          {["FOUNDER", "EXCO", "BOT"].map((groupKey) => {
            const people = leadership[groupKey];
            if (!people || people.length === 0) return null;
            const meta = GROUP_LABELS[groupKey];

            return (
              <div key={groupKey} className="mb-16 last:mb-0">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-[#0D1F3C]">{meta.title}</h3>
                  {meta.description && (
                    <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">{meta.description}</p>
                  )}
                </div>
                <div
                  className={`grid gap-6 justify-items-center ${
                    people.length === 1
                      ? "grid-cols-1 max-w-xs mx-auto"
                      : people.length === 2
                      ? "grid-cols-2 max-w-md mx-auto"
                      : "grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto"
                  }`}
                >
                  {people.map((person) => (
                    <PersonCard key={person.id} person={person} onOpen={setSelected} />
                  ))}
                </div>
              </div>
            );
          })}

          {(!leadership.EXCO || leadership.EXCO.length === 0) &&
            (!leadership.BOT || leadership.BOT.length === 0) && (
              <p className="text-center text-gray-400 text-sm mt-8">
                Executive Committee and Board of Trustees profiles will be added
                by the DFC secretariat.
              </p>
            )}
        </div>
      </section>

      {selected && (
        <ProfileModal person={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
