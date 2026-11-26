/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KidCharacter {
  id: string;
  name: string;
  description: string;
  gender: 'boy' | 'girl';
  shirtColor: string; // Tailwind bg class
  pantsColor: string; // Tailwind bg class
  hairColor: string;  // Tailwind bg class
  hairStyle: 'boy-hair' | 'girl-pigtails' | 'hijab' | 'curly-glasses';
  accessoryColor?: string; // Tailwind bg class
  emoji: string;
}

export const KID_CHARACTERS: KidCharacter[] = [
  {
    id: "budi",
    name: "Siswa Laki-laki",
    description: "Anak laki-laki yang cerdas, rapi, dan pemberani! Mengenakan seragam sekolah dasar dengan dasi merah.",
    gender: "boy",
    shirtColor: "bg-white",
    pantsColor: "bg-[#E04443]", // Merah SD
    hairColor: "bg-[#4E342E]",  // Cokelat bergelombang
    hairStyle: "boy-hair",
    accessoryColor: "bg-[#E04443]", // Dasi merah
    emoji: "👦"
  },
  {
    id: "ani",
    name: "Siswi Berhijab",
    description: "Anak perempuan yang anggun & santun! Mengenakan kerudung/hijab putih bersih yang rapi di sekolah.",
    gender: "girl",
    shirtColor: "bg-white",
    pantsColor: "bg-[#E04443]", // Merah SD
    hairColor: "bg-white",      // Kerudung putih
    hairStyle: "hijab",
    accessoryColor: "bg-white",
    emoji: "🧕"
  },
  {
    id: "citra",
    name: "Siswi Berkuncir",
    description: "Anak perempuan yang ceria & ramah! Mengenakan kuncir pigtails ganda yang manis dengan bola hiasan kuning.",
    gender: "girl",
    shirtColor: "bg-white",
    pantsColor: "bg-[#E04443]", // Merah SD
    hairColor: "bg-[#2A2438]",  // Rambut hitam keunguan
    hairStyle: "girl-pigtails",
    accessoryColor: "bg-[#F59E0B]", // Hiasan kuning emas
    emoji: "👧"
  }
];
