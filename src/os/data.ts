/**
 * data.ts — EVERYTHING about you lives here. Edit this one file and the whole
 * desktop (terminal, explorer, resume, mail, classic view, task manager...) updates.
 * Items marked "PLACEHOLDER" are guesses/samples: replace them with the real thing.
 */

export interface Project { slug: string; title: string; description: string; stack: string[]; github?: string; live?: string; status?: string; accent: string; readme: string[]; }
/**
 * A personal photo. Drop the files in /public/images/ as me-1.jpg ... me-5.jpg (see README).
 * focal = the point (in %) that must never be cropped (your face). Used for object-position + Ken Burns origin.
 */
export interface Photo { id: string; file: string; caption: string; alt: string; story?: string; focal?: { x: number; y: number }; best?: boolean; }
export interface Skill { name: string; level: number; group: string; }

export const data = {
  name: 'Asif Ahmed',
  user: 'asif',
  role: 'Voice AI & NLP Developer',
  tagline: 'CSE student · R&D intern at Reve Systems · Quantized Bangla LLM researcher',
  location: 'Dhaka, Bangladesh',
  email: 'rockyasif825@gmail.com',
  github: 'https://github.com/asifahmed1467',
  linkedin: 'https://www.linkedin.com/in/asif-ahmed-348652296/',
  /** Where the BSOD QR code points (your contact page / portfolio URL). PLACEHOLDER: set your hosted URL. */
  contactPage: 'https://github.com/asifahmed1467',
  /** Formspree endpoint, e.g. 'https://formspree.io/f/xxxxxx'. Leave '' to fall back to a mailto: link. */
  formspree: '',
  /** Browser app: embed live projects in an <iframe>. Works when hosted on your own domain; blocked inside Claude's preview. */
  browserUseIframe: false,

  /** Personal photos (3-5). `best: true` = used as the avatar (lock screen, Start menu, About...). */
  photos: [
    { id: 'p1', file: 'me-1.jpg', best: true, focal: { x: 51, y: 30 }, caption: 'Suited up, ready to build', alt: 'Asif Ahmed in a navy blazer and white shirt, standing in a modern office lobby', story: 'Suit on, laptop in the bag. Voice AI by day, Bangla NLP research by night.' },
    { id: 'p2', file: 'me-2.jpg', focal: { x: 50, y: 30 }, caption: 'Campus days with the crew · AIUB', alt: 'Four AIUB students with ID lanyards posing together in a brick-walled corridor', story: 'Four years of labs, late-night debugging and the friends who made it fun.' },
    { id: 'p3', file: 'me-3.jpg', focal: { x: 55, y: 42 }, caption: 'DUET CSE Carnival 2026', alt: 'Two attendees standing in front of the DUET CSE Carnival 2026 banner', story: 'Innovate today. Lead tomorrow. A great day at the DUET CSE Carnival 2026.' },
    { id: 'p4', file: 'me-4.jpg', focal: { x: 50, y: 42 }, caption: "Dean's List Honors · AIUB", alt: "Asif Ahmed holding two Dean's List Honors certificates from AIUB, seated on a bench beside flowering bushes", story: "Dean's List, again. Five consecutive awards and counting." }
  ] as Photo[],

  /** Floating tech badges orbiting your photo in the Classic view hero. */
  heroBadges: ['Python', 'PyTorch', 'Transformers', 'LoRA', 'wav2vec2', 'Quantization'],

  bio: [
    "Hi, I'm Asif. I'm a Computer Science & Engineering student at American International University-Bangladesh (AIUB), majoring in Data Science, AI & ML.",
    'I work on voice AI at Reve Systems: conversational voicebots, LLM pipelines and data workflows.',
    'My focus is Bangla speech & NLP: text-to-speech, homograph disambiguation and speech representation models (wav2vec2).',
    'I fine-tune transformers (BanglaBERT, Gemma) and quantize them for efficient deployment. My thesis studies quantized Bangla LLMs.',
    'Research interests: explainable AI, data mining and human-AI collaboration.'
  ],

  stats: { cgpa: '3.86 / 4.00', deans: '5 consecutive Dean\'s Awards', papers: '2 papers under review' },

  // PLACEHOLDER levels: these are rough self-ratings used for skill bars; edit freely.
  skills: [
    { name: 'Python', level: 92, group: 'Languages' }, { name: 'C++', level: 70, group: 'Languages' }, { name: 'Java', level: 72, group: 'Languages' }, { name: 'JavaScript / TypeScript', level: 70, group: 'Languages' }, { name: 'SQL', level: 75, group: 'Languages' },
    { name: 'PyTorch', level: 85, group: 'AI / ML' }, { name: 'Hugging Face', level: 88, group: 'AI / ML' }, { name: 'NLP & LLMs', level: 90, group: 'AI / ML' }, { name: 'LoRA fine-tuning', level: 84, group: 'AI / ML' }, { name: 'Model quantization', level: 86, group: 'AI / ML' },
    { name: 'ASR / TTS (wav2vec2)', level: 82, group: 'Voice AI' }, { name: 'RAG pipelines', level: 78, group: 'Voice AI' },
    { name: 'FastAPI / Flask', level: 74, group: 'Tools' }, { name: 'Docker', level: 70, group: 'Tools' }, { name: 'Git & GitHub', level: 88, group: 'Tools' }, { name: 'Automation testing', level: 80, group: 'Tools' }
  ] as Skill[],

  projects: [
    { slug: 'bangla-homograph-tts', title: 'Bangla Homograph TTS', accent: '#7c3aed', description: 'Bangla text-to-speech pipeline with context-aware homograph disambiguation for accurate pronunciation.', stack: ['Python', 'TTS', 'Docker'], github: 'https://github.com/asifahmed1467/bangla-homograph-tts', readme: ['Bangla has many homographs (same spelling, different pronunciation).', 'This pipeline disambiguates them from context before synthesis so the voice says the right word.'] },
    { slug: 'gemma-bangla-homograph', title: 'Gemma Bangla Homograph', accent: '#0ea5e9', description: 'Fine-tuned Google Gemma for context-based Bangla homograph disambiguation.', stack: ['Gemma', 'Fine-tuning', 'Jupyter'], github: 'https://github.com/asifahmed1467/gemma-bangla-homograph', readme: ['Fine-tunes a Gemma language model to pick the right homograph sense from the surrounding sentence.'] },
    { slug: 'banglabert-heteronym-quantization', title: 'BanglaBERT Heteronym Quantization', accent: '#e11d48', description: 'Quantized BanglaBERT heteronym model with a C++ inference path, evaluating accuracy and latency trade-offs.', stack: ['BanglaBERT', 'C++', 'Quantization'], github: 'https://github.com/asifahmed1467/banglabert-heteronym-fp32-vs-fp16', readme: ['Compares FP32 vs FP16 (and lower) BanglaBERT for heteronym classification.', 'Includes a C++ inference path to measure real latency, not just accuracy.'] },
    { slug: 'wav2vec2-gender-cpu-benchmark', title: 'wav2vec2 Gender CPU Benchmark', accent: '#16a34a', description: 'Speech-based gender classification with wav2vec2, benchmarked for efficient CPU inference.', stack: ['wav2vec2', 'Speech', 'CMake'], github: 'https://github.com/asifahmed1467/wav2vec2-gender-cpu-benchmark', readme: ['Benchmarks wav2vec2 gender classification on CPU to find the best speed/accuracy trade-off.'] },
    { slug: 'campus-darpan', title: 'Campus Darpan', accent: '#f59e0b', description: 'Full-stack campus management platform with a TypeScript frontend and Python backend.', stack: ['TypeScript', 'Python', 'Full-stack'], github: 'https://github.com/asifahmed1467/campus-darpan', readme: ['A campus management platform: TypeScript frontend, Python backend.'] },
    { slug: 'second-brain', title: 'Second Brain', accent: '#6366f1', description: 'Knowledge management app for capturing, organizing and retrieving information.', stack: ['Python', 'HTML'], github: 'https://github.com/asifahmed1467/second-brain', readme: ['A personal knowledge base for capturing, organizing and retrieving notes.'] },
    { slug: 'voice-bot-reve', title: 'Voice Bot System (Reve Systems)', accent: '#ec4899', description: 'End-to-end voice assistant: ASR → NLU/LLM → TTS, with LoRA fine-tuning. Company work, code is private.', stack: ['NLP', 'LoRA', 'TTS', 'Python'], status: 'Private · in progress', readme: ['Internship project at Reve Systems (R&D).', 'Covers the ASR → NLU/LLM → TTS pipeline, RAG, LoRA fine-tuning and automated testing.', 'Code is private.'] }
  ] as Project[],

  experience: [
    { title: 'Intern · Reve Systems (R&D)', when: 'Present', points: ['Developing voicebots across the ASR → NLU → TTS pipeline', 'Integrating LLMs into product workflows (RAG, systematic evaluation)', 'Fine-tuning BanglaBERT, Gemma and wav2vec2; applying model quantization', 'Data analysis, annotation guidelines, automated and manual testing'] }
  ],
  education: [
    { title: 'B.Sc. in CSE · American International University-Bangladesh', when: 'Graduating 2026', points: ['Major: Data Science, AI & ML', 'CGPA 3.86 / 4.00', "5-time consecutive Dean's Award winner", 'Thesis: Assessing Script Integrity, Performance Degradation, and Energy Efficiency in Quantized Bangla LLMs (supervisor: Dr. Nazib Abdun Nasir)'] },
    { title: 'SSC & HSC · BAF Shaheen College Kurmitola', when: '2019 · 2021', points: ['GPA 5.00 in both'] }
  ],
  publications: ['Smart Governance Framework for Project Prioritization Using AHP and Blockchain (under review)', 'Unsupervised Discovery of Human-AI Collaboration Patterns in Enterprise and Management Systems (submitted to ICCA 2026)'],
  certifications: ['Python for Everybody (Coursera)', 'Google Data Analytics Professional Certificate (Coursera)', 'IT Essentials (Cisco Networking Academy)'],

  /** PLACEHOLDER blog ideas. Replace with real posts (title, date, summary, url). */
  blog: [
    { title: 'What breaks when you quantize a Bangla LLM?', date: 'Coming soon', summary: 'Notes from my thesis on script integrity and performance degradation.', url: '' },
    { title: 'Teaching a TTS model to read Bangla homographs', date: 'Coming soon', summary: 'Context-aware disambiguation before synthesis.', url: '' }
  ],

  /** Specs shown in Settings → About and in the terminal neofetch (your skills styled as hardware). */
  specs: { device: 'ASIF-RIG', cpu: 'Python 3.12 @ 5.0 GHz (16 cores of curiosity)', gpu: 'PyTorch · Hugging Face · LoRA', ram: '64 GB of Bangla NLP + Voice AI', storage: '3.86 CGPA SSD · 5x Dean\'s Award cache', os: 'Portfolio OS 11 (build 2026)' }
};

export type AppId = 'explorer' | 'browser' | 'terminal' | 'notepad' | 'settings' | 'taskmgr' | 'photos' | 'mail' | 'calc' | 'snake' | 'invaders' | 'ailab' | 'resume' | 'about';
