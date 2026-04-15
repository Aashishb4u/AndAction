// Artist categories aligned with database and API mapping
export const ARTIST_CATEGORIES = [
  { value: "live-band", label: "Live Band" },
  { value: "spiritual", label: "Devotional/Spiritual Singer" },
  { value: "singer", label: "Singer" },
  { value: "anchor", label: "Anchor/Emcee/Host" },
  { value: "dj", label: "DJ/VJ" },
  { value: "dj-based-band", label: "DJ based Band" },
  { value: "dj-percussionist", label: "DJ Percussionist" },
  { value: "musician", label: "Musician/Instrumentalist" },
  { value: "dancer", label: "Dancer/Dance group" },
  { value: "magician", label: "Magicial/Illusionist" },
  { value: "comedian-mimicry", label: "Comedian/Mimicry" },
  { value: "special-act", label: "Special act performer" },
  { value: "motivational-speaker", label: "Motivational speaker" },
  { value: "kids-entertainer", label: "Kids entertainer" },
  { value: "folk-artist", label: "Folk Artist" },
  { value: "model", label: "Model" },
];

// Video categories (includes "All" option)
export const VIDEO_CATEGORIES = [
  { value: "all", label: "All" },
  ...ARTIST_CATEGORIES,
];
// Indian States and Union Territories
export const INDIAN_STATES = [
  { value: "andhra-pradesh", label: "Andhra Pradesh" },
  { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
  { value: "assam", label: "Assam" },
  { value: "bihar", label: "Bihar" },
  { value: "chhattisgarh", label: "Chhattisgarh" },
  { value: "goa", label: "Goa" },
  { value: "gujarat", label: "Gujarat" },
  { value: "haryana", label: "Haryana" },
  { value: "himachal-pradesh", label: "Himachal Pradesh" },
  { value: "jharkhand", label: "Jharkhand" },
  { value: "karnataka", label: "Karnataka" },
  { value: "kerala", label: "Kerala" },
  { value: "madhya-pradesh", label: "Madhya Pradesh" },
  { value: "maharashtra", label: "Maharashtra" },
  { value: "manipur", label: "Manipur" },
  { value: "meghalaya", label: "Meghalaya" },
  { value: "mizoram", label: "Mizoram" },
  { value: "nagaland", label: "Nagaland" },
  { value: "odisha", label: "Odisha" },
  { value: "punjab", label: "Punjab" },
  { value: "rajasthan", label: "Rajasthan" },
  { value: "sikkim", label: "Sikkim" },
  { value: "tamil-nadu", label: "Tamil Nadu" },
  { value: "telangana", label: "Telangana" },
  { value: "tripura", label: "Tripura" },
  { value: "uttar-pradesh", label: "Uttar Pradesh" },
  { value: "uttarakhand", label: "Uttarakhand" },
  { value: "west-bengal", label: "West Bengal" },
  // Union Territories
  { value: "andaman-and-nicobar-islands", label: "Andaman and Nicobar Islands" },
  { value: "chandigarh", label: "Chandigarh" },
  { value: "dadra-and-nagar-haveli-and-daman-and-diu", label: "Dadra and Nagar Haveli and Daman and Diu" },
  { value: "delhi", label: "Delhi" },
  { value: "jammu-and-kashmir", label: "Jammu and Kashmir" },
  { value: "ladakh", label: "Ladakh" },
  { value: "lakshadweep", label: "Lakshadweep" },
  { value: "puducherry", label: "Puducherry" },
];

// Major Indian Cities
export const INDIAN_CITIES = [
  // Maharashtra
  { value: "mumbai", label: "Mumbai" },
  { value: "pune", label: "Pune" },
  { value: "nagpur", label: "Nagpur" },
  { value: "nashik", label: "Nashik" },
  { value: "aurangabad", label: "Aurangabad" },
  { value: "solapur", label: "Solapur" },
  { value: "thane", label: "Thane" },
  { value: "navi-mumbai", label: "Navi Mumbai" },
  // Delhi
  { value: "delhi", label: "Delhi" },
  { value: "new-delhi", label: "New Delhi" },
  // Karnataka
  { value: "bangalore", label: "Bangalore" },
  { value: "bengaluru", label: "Bengaluru" },
  { value: "mysore", label: "Mysore" },
  { value: "hubli", label: "Hubli" },
  { value: "mangalore", label: "Mangalore" },
  // Tamil Nadu
  { value: "chennai", label: "Chennai" },
  { value: "coimbatore", label: "Coimbatore" },
  { value: "madurai", label: "Madurai" },
  { value: "tiruchirappalli", label: "Tiruchirappalli" },
  { value: "salem", label: "Salem" },
  // Gujarat
  { value: "ahmedabad", label: "Ahmedabad" },
  { value: "surat", label: "Surat" },
  { value: "vadodara", label: "Vadodara" },
  { value: "rajkot", label: "Rajkot" },
  // Rajasthan
  { value: "jaipur", label: "Jaipur" },
  { value: "jodhpur", label: "Jodhpur" },
  { value: "udaipur", label: "Udaipur" },
  { value: "kota", label: "Kota" },
  // Uttar Pradesh
  { value: "lucknow", label: "Lucknow" },
  { value: "kanpur", label: "Kanpur" },
  { value: "agra", label: "Agra" },
  { value: "varanasi", label: "Varanasi" },
  { value: "noida", label: "Noida" },
  { value: "ghaziabad", label: "Ghaziabad" },
  { value: "meerut", label: "Meerut" },
  { value: "allahabad", label: "Allahabad" },
  // West Bengal
  { value: "kolkata", label: "Kolkata" },
  { value: "durgapur", label: "Durgapur" },
  { value: "siliguri", label: "Siliguri" },
  // Punjab
  { value: "ludhiana", label: "Ludhiana" },
  { value: "amritsar", label: "Amritsar" },
  { value: "jalandhar", label: "Jalandhar" },
  // Haryana
  { value: "chandigarh", label: "Chandigarh" },
  { value: "gurgaon", label: "Gurgaon" },
  { value: "gurugram", label: "Gurugram" },
  { value: "faridabad", label: "Faridabad" },
  // Telangana
  { value: "hyderabad", label: "Hyderabad" },
  { value: "warangal", label: "Warangal" },
  // Andhra Pradesh
  { value: "visakhapatnam", label: "Visakhapatnam" },
  { value: "vijayawada", label: "Vijayawada" },
  { value: "guntur", label: "Guntur" },
  // Kerala
  { value: "kochi", label: "Kochi" },
  { value: "thiruvananthapuram", label: "Thiruvananthapuram" },
  { value: "kozhikode", label: "Kozhikode" },
  // Madhya Pradesh
  { value: "indore", label: "Indore" },
  { value: "bhopal", label: "Bhopal" },
  { value: "jabalpur", label: "Jabalpur" },
  { value: "gwalior", label: "Gwalior" },
  // Bihar
  { value: "patna", label: "Patna" },
  { value: "gaya", label: "Gaya" },
  // Jharkhand
  { value: "ranchi", label: "Ranchi" },
  { value: "jamshedpur", label: "Jamshedpur" },
  { value: "dhanbad", label: "Dhanbad" },
  // Odisha
  { value: "bhubaneswar", label: "Bhubaneswar" },
  { value: "cuttack", label: "Cuttack" },
  // Chhattisgarh
  { value: "raipur", label: "Raipur" },
  { value: "bhilai", label: "Bhilai" },
  // Uttarakhand
  { value: "dehradun", label: "Dehradun" },
  { value: "haridwar", label: "Haridwar" },
  // Assam
  { value: "guwahati", label: "Guwahati" },
  // Himachal Pradesh
  { value: "shimla", label: "Shimla" },
  // Goa
  { value: "panaji", label: "Panaji" },
  { value: "vasco-da-gama", label: "Vasco da Gama" },
  // Jammu and Kashmir
  { value: "srinagar", label: "Srinagar" },
  { value: "jammu", label: "Jammu" },
  // Puducherry
  { value: "puducherry", label: "Puducherry" },
];