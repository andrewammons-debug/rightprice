export interface FormData {
  year: string;
  make: string;
  modelPkg: string;
  body: string;
  miles: string;
  color: string;
  autoManual: string;
  vin: string;
  purchasedFrom: string;
  paid: string;
  price: string;
  down: string;
  remarks: string;
  signature: string;
  date: string;
  checklist: Record<string, boolean>;
}

export const CHECKLIST_LEFT = [
  "Head Lights", "Tail Lights", "Brake Lights", "Turn signals", 
  "Windshield Wipers", "Horn", "Radio", "Spare Tire", "Jack", 
  "Lug Wrench", "Rear View Mirror", "Window Motors", "Heat", 
  "( ) Buyers Guide", "Tag Bolts", "( ) A / C"
];

export const CHECKLIST_RIGHT = [
  "Oil", "Water", "Transmission Fluid", "Brake Fluid", 
  "Power steering Fluid", "Leaks", "Must have 1/4 tank of GAS", 
  "Anti-Freeze Must Be -10", "( ) Seat Belt", "( ) Spare Key & Works"
];
