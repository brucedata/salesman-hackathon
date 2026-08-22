import type { Lead, Policy, Product, Prospect } from "./types";

export const defaultPolicy: Policy = {
  companyName: "Han Studio",
  founderName: "Seoyoon Han",
  tone:
    "Warm, direct, and practical. Open with a brief acknowledgement, state the scope clearly, and keep sentences short without hype.",
  refund:
    "100% before work begins. 50% after the first concept delivery. No refund after final files are delivered. Schedule changes require three business days of notice.",
  delivery: "Brand identity: 10 business days. Landing page: 7 business days. Monthly support: one report each month.",
  doNot: [
    "Do not promise discounts without approval (students may receive up to 5% only after verification).",
    "Do not reveal competitor information.",
    "Do not promise unconfirmed features or schedules.",
    "Do not provide personal bank details; use the payment link only.",
  ],
};

export const defaultProducts: Product[] = [
  {
    id: "p_identity",
    name: "Brand Identity Package",
    price: 1200000,
    summary:
      "Logo, color system, typography, and business-card and social templates. A focused system for launching a small brand with confidence.",
    benefits: [
      "Two logo directions and one revision round",
      "Color and type guide",
      "Business-card and social-profile templates",
      "Usage guide PDF",
    ],
    slug: "identity",
    consultUrl: "https://cal.com/hanstudio/30min",
    paymentUrl: "https://pay.salesman.app/identity",
  },
  {
    id: "p_landing",
    name: "Sales Landing Page",
    price: 890000,
    summary:
      "A conversion-focused page with copy, sections, and inquiry flow for a single offer or campaign.",
    benefits: [
      "First-draft copy included",
      "Mobile-first layout",
      "Inquiry form and notification flow",
      "One revision round within 14 days",
    ],
    slug: "landing",
    consultUrl: "https://cal.com/hanstudio/30min",
    paymentUrl: "https://pay.salesman.app/landing",
  },
  {
    id: "p_retain",
    name: "Monthly Studio Support",
    price: 450000,
    period: "month",
    summary:
      "Four content pieces, inquiry-response drafts, and a monthly report for teams that need a steady creative partner.",
    benefits: ["Four content pieces", "Inquiry-draft review", "One monthly check-in", "Performance report"],
    slug: "retainer",
    consultUrl: "https://cal.com/hanstudio/ops",
    paymentUrl: "https://pay.salesman.app/retainer",
  },
];

const hoursAgo = (h: number) =>
  new Date(Date.parse("2026-08-22T04:00:00.000Z") - h * 3600_000).toISOString();

export const defaultLeads: Lead[] = [
  {
    id: "ld_phone_open",
    name: "Jinwoo Park",
    contact: "010-5621-4480",
    channel: "phone",
    message:
      "Hello, I am opening a cafe in Seocho next Wednesday. The signage, menu board, and profile do not feel consistent yet. Could you tell me whether a fast logo-only option is possible? I am thinking about a budget around KRW 1,000,000 and would appreciate a call or message after 3 PM today.",
    createdAt: hoursAgo(1),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "sms",
    stage: "new",
    productId: "p_identity",
    missed: true,
    missedKind: "call",
    thread: [
      {
        role: "customer",
        text:
          "Hello, I am opening a cafe in Seocho next Wednesday. The signage, menu board, and profile do not feel consistent yet. Could you tell me whether a fast logo-only option is possible? I am thinking about a budget around KRW 1,000,000 and would appreciate a call or message after 3 PM today.",
        at: hoursAgo(1),
      },
    ],
  },
  {
    id: "ld_web_cafe",
    name: "Doyeon Lee",
    contact: "doyeon.lee@naver.com",
    channel: "web",
    message:
      "We are renovating a cafe in Seongsu. I want the menu, wayfinding, and online ordering page to feel like one brand. Could you send an estimate and available start date for the identity package? I would like to review a proposal this week.",
    createdAt: hoursAgo(3),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "email",
    stage: "new",
    productId: "p_identity",
    missed: true,
    missedKind: "unanswered",
    thread: [
      {
        role: "customer",
        text:
          "We are renovating a cafe in Seongsu. I want the menu, wayfinding, and online ordering page to feel like one brand. Could you send an estimate and available start date for the identity package? I would like to review a proposal this week.",
        at: hoursAgo(3),
      },
    ],
  },
  {
    id: "ld_email_price",
    name: "Junhyuk Park",
    contact: "junhyuk.park@gmail.com",
    channel: "email",
    message:
      "Could you send a landing-page estimate first? I am launching an online course with a payment flow and one case-study section. I am comparing a couple of studios and need a quick sense of cost and lead time.",
    createdAt: hoursAgo(8),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "email",
    stage: "new",
    productId: "p_landing",
    missed: true,
    missedKind: "email",
    thread: [
      {
        role: "customer",
        text:
          "Could you send a landing-page estimate first? I am launching an online course with a payment flow and one case-study section. I am comparing a couple of studios and need a quick sense of cost and lead time.",
        at: hoursAgo(8),
      },
    ],
  },
  {
    id: "ld_web_student",
    name: "Sky Kim",
    contact: "skykim.dev@gmail.com",
    channel: "web",
    message:
      "I am a student preparing a graduation portfolio site. Do you have a discount option? My budget is under KRW 200,000.",
    createdAt: hoursAgo(20),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "email",
    stage: "new",
    productId: null,
    missed: true,
    missedKind: "unanswered",
    thread: [
      {
        role: "customer",
        text:
          "I am a student preparing a graduation portfolio site. Do you have a discount option? My budget is under KRW 200,000.",
        at: hoursAgo(20),
      },
    ],
  },
  {
    id: "ld_email_retain",
    name: "Eunji Choi",
    contact: "eunji@atelier-m.co",
    channel: "email",
    message:
      "I run an independent fashion brand. We need help preparing content and customer-response drafts every month. Before committing to monthly support, could we review the scope and how the first month would work? We already have a style guide.",
    createdAt: hoursAgo(30),
    intentScore: 74,
    intentLabel: "Purchase intent",
    nextAction: "Share the first-month scope and retainer terms through a short consultation link.",
    reasons: ["Clear decision owner", "Existing brand system", "Monthly need is defined"],
    draft:
      "Hi Eunji, thanks for reaching out to Han Studio.\n\nMonthly Studio Support includes four content pieces, inquiry-response drafts, and a monthly report. We can begin from your existing style guide and use the first month to align the operating scope.\n\nThe monthly fee is KRW 450,000. We confirm the next month after reviewing the delivered scope for the current month.\n\nYou can choose a 30-minute consultation here: https://cal.com/hanstudio/ops\nPayment for the monthly plan: https://pay.salesman.app/retainer\n\nPlease send two or three times that work for you, and I will confirm one promptly.",
    replyChannel: "email",
    stage: "awaiting_approval",
    productId: "p_retain",
    thread: [
      {
        role: "customer",
        text:
          "I run an independent fashion brand. We need help preparing content and customer-response drafts every month. Before committing to monthly support, could we review the scope and how the first month would work? We already have a style guide.",
        at: hoursAgo(30),
      },
      {
        role: "agent",
        text:
          "Hi Eunji, thanks for reaching out to Han Studio.\n\nMonthly Studio Support includes four content pieces, inquiry-response drafts, and a monthly report. We can begin from your existing style guide and use the first month to align the operating scope.\n\nThe monthly fee is KRW 450,000. We confirm the next month after reviewing the delivered scope for the current month.\n\nYou can choose a 30-minute consultation here: https://cal.com/hanstudio/ops\nPayment for the monthly plan: https://pay.salesman.app/retainer\n\nPlease send two or three times that work for you, and I will confirm one promptly.",
        at: hoursAgo(28),
      },
    ],
    appointment: { when: "2026-08-25T14:00:00.000Z", note: "30-minute scope consultation" },
    missed: false,
  },
  {
    id: "ld_missed_call",
    name: "Seorin Oh",
    contact: "010-4412-9088",
    channel: "phone",
    message: "Missed call twice. No voicemail left. They may have called while the studio was in a client session.",
    createdAt: hoursAgo(6),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "sms",
    stage: "new",
    productId: null,
    missed: true,
    missedKind: "call",
    thread: [
      {
        role: "customer",
        text: "Missed call twice. No voicemail left. They may have called while the studio was in a client session.",
        at: hoursAgo(6),
      },
    ],
  },
  {
    id: "ld_missed_msg",
    name: "Taeri Seo",
    contact: "kakao:atelier.taeri",
    channel: "message",
    message:
      "Could you confirm whether the business-card proof can be ready today? I sent two messages yesterday but may have caught you during production. I have a client meeting tomorrow morning.",
    createdAt: hoursAgo(4),
    intentScore: null,
    intentLabel: null,
    nextAction: null,
    reasons: [],
    draft: null,
    replyChannel: "sms",
    stage: "new",
    productId: "p_identity",
    missed: true,
    missedKind: "message",
    thread: [
      {
        role: "customer",
        text:
          "Could you confirm whether the business-card proof can be ready today? I sent two messages yesterday but may have caught you during production. I have a client meeting tomorrow morning.",
        at: hoursAgo(4),
      },
    ],
  },
];

export const defaultProspects: Prospect[] = [
  {
    id: "pr_1",
    name: "Seocho cafe opening",
    area: "Seocho",
    signal: "A new cafe announced its opening, but the signage and profile visuals do not yet use a consistent identity.",
    productId: "p_identity",
    draft: null,
    status: "ready",
  },
  {
    id: "pr_2",
    name: "Seongsu editorial shop refresh",
    area: "Seongsu",
    signal: "The campaign page has not changed since 2019 and does not provide a clear inquiry path.",
    productId: "p_landing",
    draft: null,
    status: "ready",
  },
  {
    id: "pr_3",
    name: "Mapo independent market",
    area: "Mapo",
    signal: "The market runs every month, while each vendor's business-card and product copy changes without a shared system.",
    productId: "p_identity",
    draft: null,
    status: "ready",
  },
];
