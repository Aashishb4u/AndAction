export type ServiceFaq = { question: string; answer: string };

export type DevotionalService = {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string[];
  keywords: string[];
  artistKeywords: string[];
  searchQuery: string;
  about: { heading: string; paragraphs: string[] }[];
  occasionsIntro: string;
  occasions: { title: string; text: string }[];
  inclusionsIntro: string;
  inclusions: { title: string; text: string }[];
  area: { heading: string; paragraphs: string[] };
  bookingIntro: string;
  bookingSteps: string[];
  pricing: { paragraphs: string[] };
  why: string[];
  faqs: ServiceFaq[];
};

export const DEVOTIONAL_SERVICES: DevotionalService[] = [
  {
    slug: "mata-ki-chowki",
    name: "Mata Ki Chowki",
    title: "Mata Ki Chowki Mandali & Booking in Delhi | ANDACTION",
    description:
      "Book Mata Ki Chowki in Delhi NCR with experienced devotional singers and mandalis. Explore artists, services, availability and booking options on ANDACTION.",
    h1: "Mata Ki Chowki Booking in Delhi NCR",
    intro: [
      "ANDACTION lists devotional singers and mandalis you can contact for a Mata Ki Chowki at home, in a society, or at a community hall across Delhi NCR.",
      "A Mata Ki Chowki is a devotional sitting built around Mata bhajans, a chowki or darbar setup, and aarti. Families book it for Navratri, a housewarming, a jagran night, or a neighbourhood gathering. The programme changes with the mandali: some evenings stay compact, others run longer with more musicians.",
      "On this page you can read how a typical programme is put together, what hosts usually arrange, and which artists on ANDACTION mention this kind of work. Open a profile to check the city, starting charges if the artist has added them, and send a booking request with your date and venue.",
    ],
    keywords: ["mata ki chowki", "mata ki chowki delhi", "devotional singer", "bhajan mandali"],
    artistKeywords: ["mata ki chowki", "chowki", "mata bhajan", "jagran", "bhajan mandali"],
    searchQuery: "mata ki chowki",
    about: [
      {
        heading: "What Is Mata Ki Chowki?",
        paragraphs: [
          "Mata Ki Chowki is a household and community devotional programme in honour of the Goddess. A singer or mandali leads bhajans while family and guests sit together. Many hosts set up a small darbar — a chowki, image or murti, flowers, and a place for aarti.",
          "It is booked as a religious gathering, not as a stage show. The tone stays devotional. Guests usually join the chorus, and the evening closes with aarti and prasad when the host has arranged them.",
        ],
      },
      {
        heading: "Typical Mata Ki Chowki Format",
        paragraphs: [
          "There is no single script. Depending on the mandali and the host, a programme may include a short opening, Ganesh vandana where the group follows that practice, Mata bhajans, and live singing with harmonium, dholak, or other accompanying musicians.",
          "The Mata darbar or chowki is usually prepared by the family or a decorator, not automatically by the singer. Aarti, prasad, and a closing prayer are common, and the order can shift if the gathering is part of a longer jagran.",
        ],
      },
      {
        heading: "How Long Does Mata Ki Chowki Usually Last?",
        paragraphs: [
          "Duration depends on the artist, how many bhajans are planned, whether aarti is included, and what the host has asked for. A home sitting is often shorter than a society or jagran night.",
          "Ask the mandali for their usual set length when you send the booking request. Do not assume every group offers the same hours.",
        ],
      },
      {
        heading: "Types of Artists and Mandalis",
        paragraphs: [
          "People book solo devotional singers, small bhajan groups, and fuller Mata Ki Chowki mandalis with musicians. A solo singer may perform with a harmonium player. A mandali may bring several voices and rhythm.",
          "ANDACTION shows profiles that exist on the platform. A name appears in the artist section below only when it is stored in ANDACTION’s artist records. A spiritual or bhajan singer who has not mentioned chowki work is listed as a related devotional artist, not as a confirmed chowki mandali.",
        ],
      },
      {
        heading: "What Customers Usually Require",
        paragraphs: [
          "Hosts commonly look for a singer or mandali, musicians, and a sound system sized to the room. They also think about seating, the Mata darbar or chowki decoration, flowers, aarti samagri, prasad, and someone to coordinate timings with the venue.",
          "Exact inclusions depend on the provider and the package you agree. A singer’s fee and a decorator’s work are often separate. Confirm each item in writing before the date.",
        ],
      },
    ],
    occasionsIntro:
      "The same bhajan tradition is booked in very different rooms. Tell the artist the venue type when you enquire — a drawing room and a society lawn do not need the same sound or team size.",
    occasions: [
      {
        title: "Mata Ki Chowki at home",
        text: "Home bookings are the most common request. Families want a singer who can work in a flat or independent house, with sound that suits neighbours and a sitting arrangement rather than a stage. Mention floor, parking, and how many guests you expect.",
      },
      {
        title: "Society and community programmes",
        text: "A society or RWA programme usually needs a larger mandali, earlier permission for speakers, and a clear end time. Share the lawn, clubhouse, or basement hall details so the group can judge setup time.",
      },
      {
        title: "Temple programmes and community halls",
        text: "Temple and hall bookings may already have a stage, power, and seating. Ask what the venue provides so you do not pay twice for sound or decoration.",
      },
      {
        title: "Family functions and housewarming",
        text: "Griha pravesh and other family functions often pair a shorter Mata Ki Chowki with the rest of the day’s rituals. A compact bhajan set is usually easier to fit than a full-night programme.",
      },
      {
        title: "Jagran-related evenings",
        text: "Some hosts want Mata bhajans as part of a jagran rather than a standalone chowki. Say so in the request. The artist can tell you whether they take overnight or late-night work.",
      },
    ],
    inclusionsIntro:
      "Depending on the artist or package you select, a Mata Ki Chowki enquiry may cover the items below. Some providers may also offer decor or aarti support. The exact inclusions are confirmed during booking.",
    inclusions: [
      { title: "Singer / mandali", text: "The lead voice or group that carries the bhajans." },
      { title: "Bhajan / kirtan", text: "The devotional set, chosen with the host’s occasion in mind." },
      { title: "Musicians", text: "Harmonium, dholak, and other players when the group includes them." },
      { title: "Sound system", text: "Mics and speakers if the provider supplies them. Many homes use a small setup; halls need more." },
      { title: "Decoration and darbar", text: "Chowki, flowers, and backdrop are often arranged by the host or a separate decorator." },
      { title: "Jhanki", text: "A jhanki is included only when that provider actually offers it." },
      { title: "Aarti", text: "Aarti is common at the close. Samagri may still be the host’s responsibility." },
      { title: "Event coordination", text: "Timing, access, and sound checks should be agreed before the day. ANDACTION’s booking request is the place to write those details for the artist." },
    ],
    area: {
      heading: "Mata Ki Chowki Services in Delhi NCR",
      paragraphs: [
        "These pages are written for people booking in Delhi NCR — Delhi, and nearby cities such as Noida, Gurugram, Ghaziabad, and Faridabad — because that is where most enquiries for this programme start.",
        "A profile’s city is the artist’s own location on ANDACTION. Appearing in search does not mean every singer travels to every NCR city on every date. Check the city on the profile and ask about travel when you send the request. We do not publish separate city pages until there is enough real inventory to support them.",
      ],
    },
    bookingIntro:
      "Booking on ANDACTION is a request to the artist, not an instant paid checkout. This matches how the product works today.",
    bookingSteps: [
      "Look through artists on this page, or open devotional singers and search for Mata Ki Chowki.",
      "Open a profile and read the category, city, languages, and starting charges if the artist has entered them.",
      "Send a booking request with the date, city, venue type, and a short note about home, society, or jagran.",
      "The artist confirms whether they are free and what the programme includes.",
      "Agree the fee, travel, and sound or decor separately if those are not part of their usual set.",
      "Keep the confirmation between you and the artist. ANDACTION does not invent a fixed package price.",
    ],
    pricing: {
      paragraphs: [
        "Mata Ki Chowki charges are set by the artist. They move with the size of the mandali, how long the programme runs, whether musicians and a sound system are included, decoration or darbar work, the venue, travel inside NCR, the date, and anything extra you add.",
        "ANDACTION does not publish a universal price. If an artist has saved a starting solo charge, it can show on their card and profile. That figure is a starting point. The amount you pay is what you and the artist confirm for your event.",
      ],
    },
    why: [
      "You can discover devotional singers who already have a public profile, instead of relying only on forwarded phone numbers.",
      "Profiles show the name, photo, category, and city the artist has provided.",
      "You can compare a few options and send the same event details to the person you prefer.",
      "Starting charges appear only when the artist has added them, so the page does not guess a rate.",
      "The booking request records date, location, and notes so coordination starts with the actual requirement.",
    ],
    faqs: [
      {
        question: "How can I book Mata Ki Chowki in Delhi?",
        answer:
          "Open a devotional artist on ANDACTION, check that they cover your part of Delhi NCR, and send a booking request with the date, venue, and whether you need a home sitting or a larger programme. The artist confirms availability.",
      },
      {
        question: "How much does Mata Ki Chowki cost?",
        answer:
          "There is no single rate. Cost depends on the singer or mandali, duration, musicians, sound, decor, and travel. Use the starting charge on a profile only when the artist has entered one, then confirm the final fee with them.",
      },
      {
        question: "Can I book Mata Ki Chowki at home?",
        answer:
          "Yes. Home programmes are a regular request. Share the locality, approximate guest count, and whether you already have a sound system so the artist can say if their setup fits the flat or house.",
      },
      {
        question: "What is included in a Mata Ki Chowki programme?",
        answer:
          "That depends on the provider. Many bookings are for singing and musicians. Sound, darbar decoration, jhanki, aarti samagri, and prasad are included only when you and the artist agree they are.",
      },
      {
        question: "How long does Mata Ki Chowki usually last?",
        answer:
          "It varies. Ask the mandali for their usual duration for a home chowki versus a society or jagran booking. Do not plan the rest of the evening around an assumed length.",
      },
      {
        question: "Can I choose a specific singer or mandali?",
        answer:
          "Yes. Pick the profile you want and send the request to that artist. If they are booked, you can enquire with another profile. ANDACTION does not assign a random group.",
      },
      {
        question: "Can I book Mata Ki Chowki for a society event?",
        answer:
          "Yes, if the artist takes society or community work. Mention the venue, permission for speakers, and the time you must finish. A society lawn usually needs a different setup from a living room.",
      },
      {
        question: "How early should I book Mata Ki Chowki?",
        answer:
          "Navratri, weekends, and auspicious dates fill earlier. Share your date as soon as it is fixed, especially if you want a particular singer. Weekday home sittings are often easier to place, but only the artist can confirm.",
      },
    ],
  },
  {
    slug: "sunderkand-path",
    name: "Sunderkand Path",
    title: "Sunderkand Path Booking in Delhi NCR | ANDACTION",
    description:
      "Book a Sunderkand path in Delhi NCR with devotional readers and singers. Compare artists, confirm the format, and send a booking request on ANDACTION.",
    h1: "Sunderkand Path Booking in Delhi NCR",
    intro: [
      "ANDACTION helps you find devotional artists for a Sunderkand path in Delhi NCR — at home, in a society, or in a hall.",
      "Sunderkand is the fifth kand of the Ramcharitmanas. A path is a recited or sung reading of that section, usually with a small group, accompaniment, and an aarti at the end if the host wants it. Families organise it for Tuesdays, Saturdays, a new home, or a personal mannate.",
      "Use the artist list to see who on ANDACTION mentions this work, then send a booking request with the date, language, and whether you want a spoken path, a musical reading, or both.",
    ],
    keywords: ["sunderkand path", "sunderkand delhi", "devotional path"],
    artistKeywords: ["sunderkand", "sundar kand", "ramcharitmanas", "ramayan path"],
    searchQuery: "sunderkand",
    about: [
      {
        heading: "What a Sunderkand path involves",
        paragraphs: [
          "A path here means a complete reading of the Sunderkand, not a short bhajan set that happens to mention Hanuman. Hosts usually arrange a clean sitting space, a ramayana or pothi, and seating for the readers and family.",
          "Some groups recite. Others sing the chaupais with harmonium. Tell the artist which style you follow at home so the programme matches your practice.",
        ],
      },
      {
        heading: "How the programme usually runs",
        paragraphs: [
          "A typical home path may open with a short vandana, move through the Sunderkand, and close with Hanuman aarti or a brief bhajan. The exact order depends on the reader and your family custom.",
          "If you also want Mata bhajans or a separate kirtan after the path, say that in the notes. It is a different booking from the path itself.",
        ],
      },
      {
        heading: "Who performs it",
        paragraphs: [
          "Readers range from a single experienced path reader to a small team with supporting voices and a musician. ANDACTION only lists people who have a profile. We do not add unnamed pandits or stock photos.",
        ],
      },
    ],
    occasionsIntro:
      "Say why you are organising the path. The answer changes how long people stay and how formal the setup needs to be.",
    occasions: [
      {
        title: "At home",
        text: "Most Sunderkand paths are in a flat or house. A quiet room, limited amplification, and parking for a small team matter more than a stage.",
      },
      {
        title: "Weekly or monthly sitting",
        text: "Some families keep a fixed weekday. Ask the artist whether they take repeating dates or only one-off bookings.",
      },
      {
        title: "Housewarming and family ceremonies",
        text: "A path is often scheduled beside other rituals. Share the time window so it does not clash with the pandit’s work.",
      },
      {
        title: "Society or group reading",
        text: "A larger sitting needs clearer sound and a longer setup. Confirm whether the artist is comfortable with an audience beyond the family.",
      },
    ],
    inclusionsIntro:
      "Depending on the reader you select, the booking may include only the path. Accompaniment, sound, and samagri are confirmed separately.",
    inclusions: [
      { title: "Path reader", text: "The person or group responsible for completing the Sunderkand." },
      { title: "Supporting singers", text: "Included only when that team works with more than one voice." },
      { title: "Musicians", text: "Harmonium or other support if the style is sung rather than recited." },
      { title: "Sound", text: "Often unnecessary in a small home. Needed when the audience is larger." },
      { title: "Aarti", text: "Common at the end. The host often keeps the aarti thali and prasad." },
    ],
    area: {
      heading: "Sunderkand path in Delhi NCR",
      paragraphs: [
        "Enquiries are framed for Delhi NCR. An artist’s profile city is their base. Travel to Noida, Gurugram, Ghaziabad, or Faridabad is something you confirm with them — the page does not promise coverage in every sector.",
      ],
    },
    bookingIntro: "The live product flow is a booking request from the artist profile.",
    bookingSteps: [
      "Review readers whose profiles mention Sunderkand or Ramayan path.",
      "Open the profile and note city, language, and any starting charge the artist saved.",
      "Send the date, address area, and whether you want recital or sung path.",
      "Confirm duration and who brings the pothi or sound.",
      "Final timing and fee stay between you and the artist.",
    ],
    pricing: {
      paragraphs: [
        "A path fee depends on the reader’s experience, solo versus group, musical accompaniment, travel, and whether you have asked for extra bhajans after the path.",
        "ANDACTION does not set a Sunderkand price list. Pay the amount the artist confirms for your date.",
      ],
    },
    why: [
      "Profiles are tied to real artist accounts, so you are not booking an anonymous package name.",
      "You choose the reader instead of being assigned one.",
      "Event notes travel with the booking request.",
      "Charges are shown only when the artist has entered a starting figure.",
    ],
    faqs: [
      {
        question: "How do I book a Sunderkand path in Delhi?",
        answer:
          "Choose an artist profile, check their city, and send a booking request with your date and locality in Delhi NCR. Availability comes back from the artist.",
      },
      {
        question: "Is the full Sunderkand read?",
        answer:
          "Ask for a complete path in the request if that is what you want. Some singers offer bhajans only. The profile and the artist’s reply should make the difference clear.",
      },
      {
        question: "Can it be done in a flat?",
        answer:
          "Yes. Tell the artist the gathering size so they know whether a microphone is useful.",
      },
      {
        question: "Which language is used?",
        answer:
          "Most paths follow Ramcharitmanas. Confirm Awadhi reading comfort and any explanation you want in Hindi. Do not assume a translation is included.",
      },
      {
        question: "How long does a path take?",
        answer:
          "It depends on the reading pace and whether bhajans are added. Ask the artist for their usual time before you invite guests.",
      },
      {
        question: "Do you provide a pandit as well?",
        answer:
          "ANDACTION lists performing artists. A family pandit for separate rituals is not automatically part of a path booking.",
      },
    ],
  },
  {
    slug: "akhand-ramayan-path",
    name: "Akhand Ramayan Path",
    title: "Akhand Ramayan Path Booking in Delhi NCR | ANDACTION",
    description:
      "Plan an Akhand Ramayan path in Delhi NCR with devotional readers. Check format, team size, and send a booking request through ANDACTION.",
    h1: "Akhand Ramayan Path Booking in Delhi NCR",
    intro: [
      "An Akhand Ramayan path is a continuous reading of the Ramayan, kept without a planned break until the path is complete. Families and societies in Delhi NCR book readers for home, a hall, or a temple-side programme.",
      "ANDACTION is where you look up devotional artists and send a dated request. Continuous readings need a team and a realistic timetable, so the notes you send matter more than a generic package name.",
    ],
    keywords: ["akhand ramayan", "ramayan path delhi"],
    artistKeywords: ["akhand ramayan", "ramayan path", "ramcharitmanas", "akhand path"],
    searchQuery: "ramayan path",
    about: [
      {
        heading: "What “akhand” means for booking",
        paragraphs: [
          "Akhand means the reading is meant to continue in turn until the chosen text is finished. Hosts arrange a place where readers can sit for many hours, with water, a second shift of voices, and a quiet room.",
          "Confirm which text the group reads — often Ramcharitmanas — and whether your family expects the full granth or a defined portion. Those are different commitments.",
        ],
      },
      {
        heading: "Team and timing",
        paragraphs: [
          "A single reader rarely covers a full akhand path alone. Groups rotate. Ask how many people they bring, how they split hours, and what they need overnight if the path crosses midnight.",
          "Duration is not a fixed number of hours on this page. It follows the text, the pace, and the size of the team. Get that estimate from the artist before you print invitations.",
        ],
      },
    ],
    occasionsIntro: "Akhand paths are usually planned events, not last-hour add-ons.",
    occasions: [
      {
        title: "Home path",
        text: "Possible when the house can hold a rotating team and the neighbours can accept a long, low-volume reading. Night access and washrooms should be clear.",
      },
      {
        title: "Community hall or society",
        text: "Easier for longer sittings. You will need permission for hours, power, and sometimes an overnight stay for the team.",
      },
      {
        title: "Religious occasions",
        text: "Ram Navami and other dates draw more demand. Share the date early if you want a specific group.",
      },
    ],
    inclusionsIntro:
      "Inclusions are whatever that team agrees to. A path booking does not automatically include bhojan, bedding, sound, or decoration.",
    inclusions: [
      { title: "Reading team", text: "The voices who keep the path continuous in shifts." },
      { title: "Lead reader", text: "Someone accountable for sequence and completion." },
      { title: "Musicians", text: "Only if the style is sung and the group carries instruments." },
      { title: "Host arrangements", text: "Space, light, water, and meals are usually the host’s side unless agreed otherwise." },
    ],
    area: {
      heading: "Delhi NCR coverage",
      paragraphs: [
        "The page speaks to Delhi NCR hosts. Whether a team can reach your sector depends on their profile city and the reply to your request. We are not opening city doorway pages for Noida or Gurugram until listings support them.",
      ],
    },
    bookingIntro: "Use the artist profile’s booking request. There is no separate akhand checkout.",
    bookingSteps: [
      "Shortlist artists who mention Ramayan or akhand path.",
      "Ask, in the notes, for team size and whether they cover the full text you want.",
      "Share start time, venue, and if the path may run overnight.",
      "Confirm fee, meals, and travel before you lock the date with relatives.",
    ],
    pricing: {
      paragraphs: [
        "Akhand readings cost more than a short bhajan set because of hours and headcount. Travel and overnight stay add to the conversation. There is no ANDACTION rate card for this.",
        "A starting charge on a profile, when present, is the artist’s own figure — often for a different, shorter performance. Treat it as a signal, then get a quote for the akhand booking.",
      ],
    },
    why: [
      "You see who is actually listed before you commit to a long programme.",
      "The request can carry the practical details a continuous path needs.",
      "You are not shown fabricated team sizes or completion counts.",
    ],
    faqs: [
      {
        question: "Can I book an Akhand Ramayan path at home?",
        answer:
          "Only if the team agrees the house can support a long sitting. Describe rooms, night access, and guest count in the request.",
      },
      {
        question: "How many readers are required?",
        answer:
          "The performing group decides the rotation. Ask them. This page does not prescribe a number.",
      },
      {
        question: "Does the fee include food for the team?",
        answer:
          "Assume it does not until the artist says it does. Hosts often arrange simple meals for a long path.",
      },
      {
        question: "How early should we book?",
        answer:
          "Earlier than a two-hour bhajan evening. Festival dates and weekends need more lead time because the team is committed for many hours.",
      },
      {
        question: "Will the path be in Hindi?",
        answer:
          "Ramcharitmanas paths are in Awadhi. Ask if you want Hindi explanation between sections; that is extra and not always offered.",
      },
    ],
  },
  {
    slug: "bhagwati-jagran",
    name: "Bhagwati Jagran",
    title: "Bhagwati Jagran Booking in Delhi NCR | ANDACTION",
    description:
      "Book a Bhagwati jagran in Delhi NCR with devotional mandalis. See artists, understand a night programme, and send a request on ANDACTION.",
    h1: "Bhagwati Jagran Booking in Delhi NCR",
    intro: [
      "A Bhagwati jagran is an overnight or late-night Mata bhajan programme. Societies, families, and neighbourhood groups in Delhi NCR organise it around Navratri and other devotional dates.",
      "ANDACTION lists singers and groups you can request. A jagran is louder and longer than a short home chowki, so venue rules, end time, and sound need to be in the first message.",
    ],
    keywords: ["bhagwati jagran", "jagran delhi", "mata jagran"],
    artistKeywords: ["bhagwati jagran", "jagran", "mata ki chowki", "mata bhajan"],
    searchQuery: "jagran",
    about: [
      {
        heading: "How a jagran differs from a short chowki",
        paragraphs: [
          "Both centre on Mata bhajans. A jagran is planned to run late, sometimes through the night, with a larger audience and a stronger sound system. A home chowki is often a shorter sitting.",
          "Hosts still decide the length. Some “jagrans” end before midnight because of society rules. Say which one you mean.",
        ],
      },
      {
        heading: "What the night usually contains",
        paragraphs: [
          "Depending on the mandali, the night may move through vandana, extended Mata bhajans, a few guest or family requests, and aarti towards the close. Prasad and a simple darbar are arranged by the host unless a decorator is booked.",
          "Musicians, chorus strength, and whether the group stays for the full window are part of the quote — not a standard inclusion list.",
        ],
      },
    ],
    occasionsIntro: "Jagran bookings fail when the venue cannot host the hours. Start with permission.",
    occasions: [
      {
        title: "Society jagran",
        text: "RWAs often cap speaker volume and closing time. Share those limits. A mandali that only works full-night may not be the right fit.",
      },
      {
        title: "Open ground or community hall",
        text: "More room for sound and seating. You will still need power, stage or carpet plan, and a person on site when the team arrives.",
      },
      {
        title: "Home jagran",
        text: "Possible for a shorter late evening. A full-night programme in a residential street needs neighbour consent. Mention this honestly in the request.",
      },
      {
        title: "Navratri and other dates",
        text: "Demand clusters on festival nights. If the date is fixed by the panchang or the society calendar, enquire early.",
      },
    ],
    inclusionsIntro:
      "Depending on the mandali, a jagran quote may cover performance only. Sound, tent, darbar, and prasad are often separate vendors.",
    inclusions: [
      { title: "Mandali", text: "Singers who carry the night’s bhajans." },
      { title: "Musicians", text: "Typically discussed as part of the group’s strength, not assumed." },
      { title: "Sound system", text: "Essential for a ground or hall. Confirm ownership: artist, venue, or a sound vendor." },
      { title: "Darbar and decor", text: "Usually the host’s arrangement unless the provider offers it." },
      { title: "Aarti", text: "Often placed at a decided hour. Samagri stays with the organisers unless agreed." },
    ],
    area: {
      heading: "Jagran artists and Delhi NCR",
      paragraphs: [
        "Night programmes involve travel and return time, so an artist based in one NCR city may decline another on a given date. Read the city on the profile and ask. This page does not claim a mandali in every sector.",
      ],
    },
    bookingIntro: "Send a booking request from the profile. Describe the night clearly.",
    bookingSteps: [
      "Choose a singer or group whose profile fits devotional or jagran work.",
      "Write start time, hard stop time, venue, and expected crowd.",
      "Ask what they bring: voices, instruments, sound.",
      "Confirm fee including late hours and travel.",
      "Align decor and prasad with your own vendors if the artist does not supply them.",
    ],
    pricing: {
      paragraphs: [
        "Jagran pricing reflects hours, headcount, sound, and how late the programme ends. A society slot that must stop at 11 pm is a different job from an all-night ground programme.",
        "No standard Bhagwati jagran price is published here. Use an artist’s saved starting charge only as their own listing, then request a figure for your night.",
      ],
    },
    why: [
      "You can approach a named profile with the venue constraints already written down.",
      "Related devotional artists stay labelled as related when their profile does not mention jagran.",
      "Coordination starts from the booking request already built into artist profiles.",
    ],
    faqs: [
      {
        question: "Can a society book a Bhagwati jagran?",
        answer:
          "Yes, when the artist accepts society work and the RWA allows the timing and sound. Put the cutoff time in the request.",
      },
      {
        question: "Is sound included?",
        answer:
          "Only if that mandali says so. Many quotes separate the performance from speakers and mics.",
      },
      {
        question: "How late do jagrans run?",
        answer:
          "As late as your venue allows and the group agrees. There is no single closing time.",
      },
      {
        question: "Do we need a separate decorator?",
        answer:
          "Often yes. Ask the artist before you assume the darbar is part of the singing fee.",
      },
      {
        question: "How do I book?",
        answer:
          "Open the artist profile on ANDACTION and submit a booking request with the date and venue. The artist confirms.",
      },
    ],
  },
  {
    slug: "khatu-shyam-bhajan",
    name: "Khatu Shyam Bhajan",
    title: "Khatu Shyam Bhajan Booking in Delhi NCR | ANDACTION",
    description:
      "Book Khatu Shyam bhajan singers in Delhi NCR for home and community gatherings. View artists and send a booking request on ANDACTION.",
    h1: "Khatu Shyam Bhajan Booking in Delhi NCR",
    intro: [
      "Khatu Shyam bhajans are devotional songs centred on Shyam Baba, sung at homes, societies, and small community sittings. Hosts in Delhi NCR book a singer or a small group for a shaam, a birthday, or a personal gathering.",
      "ANDACTION shows artist profiles and takes a booking request. Look for singers who actually list this repertoire. A general devotional profile is not the same as a Khatu Shyam specialist.",
    ],
    keywords: ["khatu shyam bhajan", "shyam bhajan delhi"],
    artistKeywords: ["khatu shyam", "shyam baba", "shyam bhajan", "khatu"],
    searchQuery: "khatu shyam",
    about: [
      {
        heading: "What hosts usually book",
        paragraphs: [
          "Most requests are for a lead singer who knows the common Shyam bhajans, with or without a harmonium and dholak player. Some evenings stay with familiar songs. Others add a short kirtan stretch and aarti.",
          "The mood is participatory. Guests sing along. A theatre-style show is the wrong brief — say if you want a simple baithak instead.",
        ],
      },
      {
        heading: "Format and length",
        paragraphs: [
          "A home shaam might be a compact set. A society programme can run longer and need clearer sound. Duration is agreed with the singer. This page does not fix a runtime.",
          "If you want a specific bhajan list, send it in the notes. Not every singer uses the same popular set.",
        ],
      },
    ],
    occasionsIntro: "Tell the singer who the gathering is for. Repertoire and volume follow from that.",
    occasions: [
      {
        title: "Home shaam",
        text: "A living-room booking with family and neighbours. Small sound, limited musicians, and a clear finish time work best.",
      },
      {
        title: "Society or clubhouse",
        text: "More guests, so confirm speakers and whether the group is used to a hall rather than a room.",
      },
      {
        title: "Personal ceremonies",
        text: "Birthdays and mannats sometimes include Shyam bhajans before or after another ritual. Share the sequence so the singer is not double-booked against a pandit.",
      },
    ],
    inclusionsIntro:
      "Depending on the artist, you are booking the performance. Decor, prasad, and a full sound rig may sit outside that fee.",
    inclusions: [
      { title: "Singer", text: "The voice leading Khatu Shyam bhajans." },
      { title: "Accompanists", text: "Only when the artist performs with them." },
      { title: "Sound", text: "Ask. A home set and a hall set are priced differently." },
      { title: "Aarti", text: "Optional and only if you want it at the end." },
    ],
    area: {
      heading: "Delhi NCR",
      paragraphs: [
        "The copy is aimed at Delhi NCR bookings. Artist travel follows the city on their profile and their reply. We do not list fake local mandalis for sectors where ANDACTION has no matching profile.",
      ],
    },
    bookingIntro: "Same booking request used across artist profiles.",
    bookingSteps: [
      "Search artists for Khatu Shyam or open related devotional profiles and read their bio.",
      "Prefer a profile that names this repertoire.",
      "Send date, locality, guest estimate, and any bhajans you want included.",
      "Confirm musicians, sound, and fee before you circulate the time to guests.",
    ],
    pricing: {
      paragraphs: [
        "Fees follow the singer, the number of musicians, hours, sound, and distance inside NCR. A solo baithak and a five-person set are not the same quote.",
        "ANDACTION does not publish a Khatu Shyam price band. Starting charges appear only if that artist stored one.",
      ],
    },
    why: [
      "You can filter toward artists whose own text mentions Shyam bhajans.",
      "Related singers are not mislabelled as Khatu specialists.",
      "The request form already collects date, city, and notes.",
    ],
    faqs: [
      {
        question: "Can I book Khatu Shyam bhajans at home?",
        answer:
          "Yes. Describe the room and guest count so the singer can suggest a solo or a small group.",
      },
      {
        question: "Can I request particular bhajans?",
        answer:
          "You can send a list. The artist will say what they actually perform.",
      },
      {
        question: "Do you have mandalis in every NCR city?",
        answer:
          "Only where a real profile exists and the artist agrees to travel. Check the city on the card.",
      },
      {
        question: "How much should we budget?",
        answer:
          "Ask the artist for your date and team size. This page will not invent a range.",
      },
      {
        question: "How do I book on ANDACTION?",
        answer:
          "Open the profile and send a booking request. The artist accepts or declines based on the date.",
      },
    ],
  },
  {
    slug: "sai-sandhya",
    name: "Sai Sandhya",
    title: "Sai Sandhya Bhajan Booking in Delhi NCR | ANDACTION",
    description:
      "Book a Sai Sandhya in Delhi NCR with bhajan singers. Review artists, plan the evening, and send a booking request on ANDACTION.",
    h1: "Sai Sandhya Booking in Delhi NCR",
    intro: [
      "A Sai Sandhya is an evening of Sai bhajans — often a Thursday gathering at home, in a society, or with a small satsang group. People in Delhi NCR book a singer who knows the common Sai repertoire and can hold a calm, seated programme.",
      "ANDACTION lets you open artist profiles and send a request with your Thursday or event date. Read the bio before you assume every devotional singer offers a Sai evening.",
    ],
    keywords: ["sai sandhya", "sai bhajan delhi"],
    artistKeywords: ["sai sandhya", "sai bhajan", "sai baba", "shirdi"],
    searchQuery: "sai bhajan",
    about: [
      {
        heading: "What a Sai Sandhya looks like",
        paragraphs: [
          "Hosts set a simple seating, a photograph or corner for Sai, and a singer who leads bhajans. Aarti and prasad are frequent but organised by the family. Some groups add a short reading or a meditation pause. Others stay with songs only.",
          "It is closer to a satsang than to a concert. Volume should suit a home or a community room.",
        ],
      },
      {
        heading: "Artists you can request",
        paragraphs: [
          "Solo bhajan singers are the usual fit. A second musician joins when the singer works that way. If the profile does not mention Sai, treat them as a general devotional option and ask directly.",
        ],
      },
    ],
    occasionsIntro: "Thursday evenings are the familiar pattern. Other dates are fine when the singer is free.",
    occasions: [
      {
        title: "Thursday home sandhya",
        text: "A repeating or one-time home sitting. If you want the same singer every week, ask whether they take standing weekday bookings.",
      },
      {
        title: "Society satsang",
        text: "A clubhouse slot with a published start and end. Share the gate pass process and sound rules.",
      },
      {
        title: "Special gatherings",
        text: "Gurupurnima, a new home, or a family function sometimes includes a Sai bhajan hour inside a longer day. Give the exact window.",
      },
    ],
    inclusionsIntro:
      "The singer’s set is the core. Everything else depends on the person you book.",
    inclusions: [
      { title: "Bhajan singer", text: "Leads the Sai repertoire for the agreed time." },
      { title: "Accompaniment", text: "Harmonium or other support only if included by that artist." },
      { title: "Sound", text: "Often a single mic in a room. Halls may need more, priced apart." },
      { title: "Aarti support", text: "The host usually leads aarti. Confirm if you want the singer to cue it." },
    ],
    area: {
      heading: "Sai Sandhya in Delhi NCR",
      paragraphs: [
        "This page is for Delhi NCR hosts. Availability in a particular block of Noida or Gurugram is a question for the artist, based on the city they have listed and the date you need.",
      ],
    },
    bookingIntro: "Booking is the profile request flow, with your evening details in the notes.",
    bookingSteps: [
      "Find a singer whose profile mentions Sai bhajans, or ask a devotional singer if they take Sai sandhyas.",
      "Send the date, start time, locality, and whether this is a home or society sitting.",
      "Confirm duration and any weekly repeat.",
      "Agree the fee and whether a second musician is coming.",
    ],
    pricing: {
      paragraphs: [
        "A Sai Sandhya fee tracks the singer, duration, extra musicians, sound, and travel. A one-hour home Thursday is not priced like a hall programme.",
        "There is no fixed ANDACTION tariff. If a starting charge is visible, it was entered by the artist and still needs confirmation for your evening.",
      ],
    },
    why: [
      "You book a person you can read about, not an unnamed “Sai package”.",
      "Notes capture Thursday timing, venue, and repeat dates.",
      "We do not add testimonials or ratings the product does not store.",
    ],
    faqs: [
      {
        question: "Can I book a Sai Sandhya at home on Thursday?",
        answer:
          "Yes, if the singer is free. Mention that it is a Thursday home sitting and how many people you expect.",
      },
      {
        question: "Will the singer know specific Sai bhajans?",
        answer:
          "Send the names you care about. They will confirm what is in their set.",
      },
      {
        question: "Is aarti included?",
        answer:
          "The family usually performs aarti. The singer can time the last bhajan to lead into it if you ask.",
      },
      {
        question: "Can this be a weekly booking?",
        answer:
          "Only if that artist agrees to a repeating slot. One request does not reserve every Thursday.",
      },
      {
        question: "How is the price decided?",
        answer:
          "The artist quotes for your duration and location. ANDACTION does not add a markup table on this page.",
      },
    ],
  },
];

export function getDevotionalService(slug: string) {
  return DEVOTIONAL_SERVICES.find((service) => service.slug === slug);
}
