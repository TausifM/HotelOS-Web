// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 1: Hindi Language Toggle
// ═══════════════════════════════════════════════════════════════════════════════

// FRONTEND: web/src/lib/i18n.ts
export const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard', reservations: 'Reservations', guests: 'Guests',
    checkIn: 'Check In', checkOut: 'Check Out', billing: 'Billing',
    rooms: 'Rooms', housekeeping: 'Housekeeping', reports: 'Reports',
    settings: 'Settings', staff: 'Staff', restaurant: 'Restaurant',
    newReservation: 'New Reservation', walkIn: 'Walk-in',
    totalRevenue: 'Total Revenue', occupancy: 'Occupancy',
    arrivals: 'Arrivals Today', departures: 'Departures Today',
    guestName: 'Guest Name', phone: 'Phone', roomNumber: 'Room Number',
    checkInDate: 'Check-in Date', checkOutDate: 'Check-out Date',
    nights: 'Nights', adults: 'Adults', children: 'Children',
    totalAmount: 'Total Amount', balanceDue: 'Balance Due', paid: 'Paid',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
    search: 'Search', filter: 'Filter', export: 'Export', print: 'Print',
    idVerified: 'ID Verified', idNotVerified: 'ID Not Verified',
    verifyId: 'Verify ID', postCharge: 'Post Charge', recordPayment: 'Record Payment',
    gstInvoice: 'GST Invoice', upiQR: 'UPI QR', sendLink: 'Send Link',
    vacant: 'Vacant', occupied: 'Occupied', housekeeping_short: 'H/K',
    outOfOrder: 'Out of Order', doNotDisturb: 'Do Not Disturb',
    logout: 'Logout', language: 'Language',
  },
  hi: {
    dashboard: 'डैशबोर्ड', reservations: 'आरक्षण', guests: 'मेहमान',
    checkIn: 'चेक इन', checkOut: 'चेक आउट', billing: 'बिलिंग',
    rooms: 'कमरे', housekeeping: 'हाउसकीपिंग', reports: 'रिपोर्ट',
    settings: 'सेटिंग्स', staff: 'स्टाफ', restaurant: 'रेस्तरां',
    newReservation: 'नया आरक्षण', walkIn: 'वॉक-इन',
    totalRevenue: 'कुल आय', occupancy: 'अधिभोग',
    arrivals: 'आज आगमन', departures: 'आज प्रस्थान',
    guestName: 'मेहमान का नाम', phone: 'फोन', roomNumber: 'कमरा नंबर',
    checkInDate: 'चेक-इन तारीख', checkOutDate: 'चेक-आउट तारीख',
    nights: 'रातें', adults: 'वयस्क', children: 'बच्चे',
    totalAmount: 'कुल राशि', balanceDue: 'बकाया राशि', paid: 'भुगतान',
    save: 'सहेजें', cancel: 'रद्द करें', edit: 'संपादित करें', delete: 'हटाएं',
    search: 'खोजें', filter: 'फ़िल्टर', export: 'निर्यात', print: 'प्रिंट',
    idVerified: 'आईडी सत्यापित', idNotVerified: 'आईडी असत्यापित',
    verifyId: 'आईडी सत्यापित करें', postCharge: 'चार्ज पोस्ट करें', recordPayment: 'भुगतान दर्ज करें',
    gstInvoice: 'जीएसटी चालान', upiQR: 'UPI QR', sendLink: 'लिंक भेजें',
    vacant: 'खाली', occupied: 'व्यस्त', housekeeping_short: 'सफाई',
    outOfOrder: 'खराब', doNotDisturb: 'परेशान न करें',
    logout: 'लॉग आउट', language: 'भाषा',
  },
} as const;

export type Lang = 'en' | 'hi';
export type TKey = keyof typeof TRANSLATIONS.en;