/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scenario, MapData } from "../types";

export const DEFAULT_SCENARIOS: Scenario[] = [
  // ================= MAP 1 — HALAMAN SEKOLAH (5 Skenario) =================

  {
    id: "sc-school-1",
    npcId: "school-npc-1",
    npcName: "Tamu di Gerbang",
    npcType: "stranger",
    mapId: "school",
    category: "Waspada Orang Asing (Stranger Danger)",
    calloutText: "Halo [Nama Anak]! Sini sebentar Nak, Om diminta ayahmu jemput sekarang.",
    dialogueText: "Hei [Nama Anak], ayahmu minta aku jemput kamu sekarang. Ayo keluar gerbang ikut aku, jangan bilang guru atau satpam ya!",
    question: "Apa yang harus kamu lakukan?",
    questionAudioUrl: "/audio/sc_school_1_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Menolak tegas, tetap di dalam sekolah, dan lapor ke guru atau satpam",
        isCorrect: true,
        feedback: "Hebat sekali, [Nama Anak]! Selalu konfirmasi ke guru atau satpam sebelum ikut siapapun yang mengaku suruhan orang tua.",
        feedbackAudioUrl: "/audio/sc_school_1_opt_a.mp3"
      },
      {
        id: "b",
        text: "Langsung ikut karena dia tahu namaku dan mengaku disuruh ayah",
        isCorrect: false,
        feedback: "Waspada! Namamu bisa dilihat dari seragam atau tas. Kalimat \x27jangan bilang guru atau satpam\x27 adalah tanda bahaya utama.",
        feedbackAudioUrl: "/audio/sc_school_1_opt_b.mp3"
      },
      {
        id: "c",
        text: "Diam saja lalu menunggu sendirian di luar gerbang sekolah",
        isCorrect: false,
        feedback: "Menunggu sendirian di luar gerbang tetap berbahaya. Segera masuk ke area ramai dan beri tahu guru atau satpam.",
        feedbackAudioUrl: "/audio/sc_school_1_opt_c.mp3"
      }
    ]
  },
  {
    id: "sc-school-2",
    npcId: "school-npc-2",
    npcName: "Petugas Sekolah",
    npcType: "authority",
    mapId: "school",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "[Nama Anak], bisa tolong bantu Bapak sebentar di ruang sebelah?",
    dialogueText: "[Nama Anak], ayo ikut masuk ke gudang sebentar. Ada tugas khusus, kamu sendirian saja ya, jangan ajak teman.",
    question: "Apa yang harus kamu lakukan?",
    questionAudioUrl: "/audio/sc_school_2_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Ikut masuk karena dia memakai seragam petugas sekolah",
        isCorrect: false,
        feedback: "Hati-hati! Orang dewasa yang baik tidak akan mengajak anak masuk ke gudang sepi sendirian. Segera tolak dan lapor guru.",
        feedbackAudioUrl: "/audio/sc_school_2_opt_a.mp3"
      },
      {
        id: "b",
        text: "Mau ikut masuk ke gudang asalkan boleh mengajak satu teman",
        isCorrect: false,
        feedback: "Ruang gudang sepi tetap berisiko tinggi bila ajakannya mencurigakan. Tolak dengan sopan dan laporkan ke guru kelas.",
        feedbackAudioUrl: "/audio/sc_school_2_opt_b.mp3"
      },
      {
        id: "c",
        text: "Menolak tegas dan segera pergi ke area ramai yang ada guru",
        isCorrect: true,
        feedback: "Luar biasa, [Nama Anak]! Menolak diajak sendirian ke ruang sepi adalah langkah tepat untuk melindungi dirimu.",
        feedbackAudioUrl: "/audio/sc_school_2_opt_c.mp3"
      }
    ]
  },
  {
    id: "sc-school-3",
    npcId: "school-npc-3",
    npcName: "Teman di Taman",
    npcType: "peer",
    mapId: "school",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "Hei [Nama Anak]! Sini duduk main bareng aku di bangku taman yuk!",
    dialogueText: "Hahaha santai [Nama Anak], kan cuma bercanda pegang bagian pribadimu! Rahasia kita berdua kok, jangan lebay bilang guru!",
    question: "Bagaimana sikapmu?",
    questionAudioUrl: "/audio/sc_school_3_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Diam saja karena takut dijauhi teman atau dibilang lebay",
        isCorrect: false,
        feedback: "Ingat! Sentuhan di bagian tubuh pribadi sama sekali bukan bahan bercandaan, siapapun pelakunya.",
        feedbackAudioUrl: "/audio/sc_school_3_opt_a.mp3"
      },
      {
        id: "b",
        text: "Berkata tegas \x27Jangan sentuh tubuhku!\x27 lalu segera lapor guru",
        isCorrect: true,
        feedback: "Berani sekali, [Nama Anak]! Tubuhmu adalah hakmu sepenuhnya, dan melapor ke guru menjaga semua teman tetap aman.",
        feedbackAudioUrl: "/audio/sc_school_3_opt_b.mp3"
      },
      {
        id: "c",
        text: "Menjauh dari teman itu tetapi merahasiakannya dari guru",
        isCorrect: false,
        feedback: "Menjauh sudah bagus, tetapi kamu tetap wajib melapor ke guru atau orang tua agar perbuatan itu tidak terulang lagi.",
        feedbackAudioUrl: "/audio/sc_school_3_opt_c.mp3"
      }
    ]
  },
  {
    id: "sc-school-4",
    npcId: "school-npc-4",
    npcName: "Pengunjung Halaman",
    npcType: "stranger",
    mapId: "school",
    category: "Waspada Orang Asing (Stranger Danger)",
    calloutText: "Hai [Nama Anak]! Sini deh, Kakak bawa bingkisan kejutan bagus buatmu!",
    dialogueText: "Hei [Nama Anak], mau hadiah keren? Ayo ikut ke parkiran luar sebentar, ada kejutan rahasia buatmu. Jangan bilang siapa-siapa ya!",
    question: "Apa yang harus kamu lakukan?",
    questionAudioUrl: "/audio/sc_school_4_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Menolak tegas, mundur menjauh, dan melapor ke guru atau satpam",
        isCorrect: true,
        feedback: "Cerdas sekali, [Nama Anak]! Orang asing yang berniat baik tidak pernah memberi hadiah sambil meminta rahasia.",
        feedbackAudioUrl: "/audio/sc_school_4_opt_a.mp3"
      },
      {
        id: "b",
        text: "Ikut ke parkiran sebentar karena penasaran dengan hadiahnya",
        isCorrect: false,
        feedback: "Bahaya! Iming-iming hadiah rahasia adalah jebakan umum untuk membawa anak menjauh dari pengawasan guru.",
        feedbackAudioUrl: "/audio/sc_school_4_opt_b.mp3"
      },
      {
        id: "c",
        text: "Menolak hadiahnya tetapi tetap berdiri mengobrol di dekatnya",
        isCorrect: false,
        feedback: "Tetap berdiri di dekatnya memberi celah untuk terus membujukmu. Segera jaga jarak aman dan hampiri guru.",
        feedbackAudioUrl: "/audio/sc_school_4_opt_c.mp3"
      }
    ]
  },
  {
    id: "sc-school-5",
    npcId: "school-npc-5",
    npcName: "Kakak Kelas",
    npcType: "peer",
    mapId: "school",
    category: "Anti-Perundungan (Bullying)",
    calloutText: "Hei [Nama Anak], sini ke lapangan ikut main seru bareng Kakak!",
    dialogueText: "Hei [Nama Anak], sini ikut main kasar sama aku sekarang! Awas ya kalau kamu berani nolak atau lapor guru!",
    question: "Bagaimana sikapmu?",
    questionAudioUrl: "/audio/sc_school_5_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Terpaksa menuruti kemauannya karena takut diancam",
        isCorrect: false,
        feedback: "Rasa takut itu wajar, tetapi menuruti pelaku justru membahayakanmu. Segera menjauh dan minta bantuan guru.",
        feedbackAudioUrl: "/audio/sc_school_5_opt_a.mp3"
      },
      {
        id: "b",
        text: "Menuruti sebentar lalu berjanji tidak akan cerita ke siapa-siapa",
        isCorrect: false,
        feedback: "Jangan pernah merahasiakan perundungan! Diam hanya membuat pelaku terus mengancammu di hari berikutnya.",
        feedbackAudioUrl: "/audio/sc_school_5_opt_b.mp3"
      },
      {
        id: "c",
        text: "Berseru minta tolong dan berlari menuju tempat yang ramai guru",
        isCorrect: true,
        feedback: "Tangguh sekali, [Nama Anak]! Meminta pertolongan dan melapor ke guru adalah cara paling berani menghentikan bullying.",
        feedbackAudioUrl: "/audio/sc_school_5_opt_c.mp3"
      }
    ]
  },

  // ================= MAP 2 — DALAM KELAS (5 Skenario) =================

  {
    id: "sc-class-1",
    npcId: "class-npc-1",
    npcName: "Pak Guru Pengganti",
    npcType: "authority",
    mapId: "class",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "[Nama Anak], sebelum pulang ke meja Bapak sebentar ya, ada perlu.",
    dialogueText: "[Nama Anak], teman-temanmu sudah pulang semua. Tutup pintunya dulu ya, Bapak mau bicara berdua saja denganmu.",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Izin keluar kelas dengan tegas menuju tempat ramai dan lapor orang tua",
        isCorrect: true,
        feedback: "Tepat sekali, [Nama Anak]! Anak tidak boleh diminta berada berdua saja di ruang tertutup, sekalipun oleh orang dewasa di sekolah.",
        feedbackAudioUrl: "/audio/pak_guru_benar_1.mp3"
      },
      {
        id: "b",
        text: "Menutup pintu dan tetap tinggal berdua karena segan menolak guru",
        isCorrect: false,
        feedback: "Menghormati guru itu baik, tetapi kamu berhak menolak berada berdua saja di dalam ruangan yang pintunya ditutup.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Diam gugup di dekat meja sambil bingung mencari alasan",
        isCorrect: false,
        feedback: "Jangan ragu! Katakan sopan 'Maaf Pak, penjemput saya sudah menunggu di luar' lalu segera keluar menuju tempat ramai.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-class-2",
    npcId: "class-npc-2",
    npcName: "Teman Sebangku",
    npcType: "peer",
    mapId: "class",
    category: "Privasi dan Keamanan Citra Diri",
    calloutText: "Psst [Nama Anak], sini merapat! Aku punya video lucu rahasia nih!",
    dialogueText: "Psst, [Nama Anak]! Lihat video rahasia di HP-ku ini yuk, seru banget! Jangan keras-keras ya, nanti ketahuan guru.",
    question: "Bagaimana sikapmu?",
    questionAudioUrl: "/audio/sc_class_2_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Ikut mengintip layar HP-nya karena penasaran",
        isCorrect: false,
        feedback: "Waspada! Tontonan yang sengaja disembunyikan dari guru biasanya berisi konten tidak pantas atau kekerasan.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "b",
        text: "Menolak halus tapi membiarkan dia menunjukkannya ke teman lain",
        isCorrect: false,
        feedback: "Menolak sudah baik, tetapi sebaiknya lapor ke guru agar teman-teman sekelasmu juga terlindungi.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Menolak tegas melihatnya dan memberi tahu guru kelas",
        isCorrect: true,
        feedback: "Hebat, [Nama Anak]! Kamu menjaga diri sendiri sekaligus membantu guru membimbing temanmu dengan bijak.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_1.mp3"
      }
    ]
  },
  {
    id: "sc-class-3",
    npcId: "class-npc-3",
    npcName: "Meja Laptop Kelas",
    npcType: "stranger",
    mapId: "class",
    category: "Keselamatan Digital",
    calloutText: "Ting! Hai [Nama Anak], ada pesan sapaan baru masuk di layar laptop!",
    dialogueText: "Hai [Nama Anak], aku guru privat baru dari sekolah. Ayo video call sekarang, pastikan kamu sendirian tanpa ada orang lain ya!",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Langsung menerima panggilan video call secara diam-diam",
        isCorrect: false,
        feedback: "Sangat berbahaya! Di internet siapa saja bisa mengaku guru. Ajakan video call sembunyi-sembunyi adalah tanda bahaya.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "b",
        text: "Menutup pesan chat tersebut dan segera melapor ke guru kelas",
        isCorrect: true,
        feedback: "Cerdas sekali, [Nama Anak]! Selalu libatkan guru atau orang tua setiap kali menerima pesan asing di perangkat digital.",
        feedbackAudioUrl: "/audio/bapak_guru_benar_1.mp3"
      },
      {
        id: "c",
        text: "Membiarkan laptop tetap terbuka begitu saja tanpa melapor",
        isCorrect: false,
        feedback: "Tidak membalas sudah benar, tetapi segera tutup obrolan dan lapor guru agar teman lain tidak ikut terjebak.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-class-4",
    npcId: "class-npc-4",
    npcName: "Teman di Pojok Baca",
    npcType: "peer",
    mapId: "class",
    category: "Keselamatan Sosial",
    calloutText: "[Nama Anak], sini deh! Aku nemu tempat main rahasia yang seru banget!",
    dialogueText: "[Nama Anak], ikut aku ke gudang belakang yuk! Ada sesuatu yang seru di sana, tapi jangan bilang guru ya!",
    question: "Bagaimana sikapmu?",
    options: [
      {
        id: "a",
        text: "Menolak ajakannya dengan tegas dan memberi tahu guru",
        isCorrect: true,
        feedback: "Bijak sekali, [Nama Anak]! Ajakan ke tempat sepi yang dirahasiakan dari guru selalu harus ditolak dan dilaporkan.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_2.mp3"
      },
      {
        id: "b",
        text: "Langsung ikut karena dia teman baikku di kelas",
        isCorrect: false,
        feedback: "Meski dia teman dekat, tempat tersembunyi tanpa pengawasan guru tetap berbahaya bagi keselamatan kalian.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "c",
        text: "Menolak ikut tetapi berjanji merahasiakannya dari guru",
        isCorrect: false,
        feedback: "Menolak sudah bagus, namun tetap beri tahu guru agar temanmu tidak celaka atau mengajak siswa lain ke sana.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-class-5",
    npcId: "class-npc-5",
    npcName: "Orang di Luar Kelas",
    npcType: "stranger",
    mapId: "class",
    category: "Privasi dan Keamanan Citra Diri",
    calloutText: "Halo [Nama Anak]! Sini lihat ke jendela sebentar yuk, Kakak mau menyapa!",
    dialogueText: "Ssst, [Nama Anak]! Coba menghadap ke jendela sebentar, mau aku foto diam-diam ya. Jangan bilang gurumu di depan!",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Pura-pura tidak dengar dan lanjut duduk diam di dekat jendela",
        isCorrect: false,
        feedback: "Waspada! Memotret anak tanpa izin melanggar privasi dan fotomu bisa disalahgunakan. Segera lapor guru!",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "b",
        text: "Cuma berbisik ke teman sebangku sambil ikut melihat ke jendela",
        isCorrect: false,
        feedback: "Bercerita ke teman belum cukup menghentikan pelaku. Segera panggil guru agar satpam bisa mengamankan area luar.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Menjauh dari jendela dan langsung melapor ke guru di depan kelas",
        isCorrect: true,
        feedback: "Tanggap sekali, [Nama Anak]! Guru dan satpam sekolah bisa segera bertindak menjaga keamanan seluruh kelas.",
        feedbackAudioUrl: "/audio/pak_guru_benar_1.mp3"
      }
    ]
  },

  // ================= MAP 3 — JALAN PULANG (5 Skenario) =================

  {
    id: "sc-street-1",
    npcId: "street-npc-1",
    npcName: "Pengendara Mobil",
    npcType: "stranger",
    mapId: "street",
    category: "Waspada Orang Asing (Stranger Danger)",
    calloutText: "Halo [Nama Anak]! Siang-siang panas begini, yuk bareng mobil Om saja!",
    dialogueText: "[Nama Anak], ayo naik mobilku! Aku teman lama ayahmu, kasihan kalau kamu jalan kaki panas-panas begini.",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Menolak tegas, jaga jarak dari mobil, dan masuk ke toko atau pos ramai",
        isCorrect: true,
        feedback: "Siaga sekali, [Nama Anak]! Jangan pernah naik kendaraan orang asing tanpa konfirmasi langsung dari orang tuamu.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_4.mp3"
      },
      {
        id: "b",
        text: "Naik ke mobilnya karena dia ramah dan tahu namaku",
        isCorrect: false,
        feedback: "Bahaya! Pelaku kejahatan sering berpakaian rapi, ramah, dan membaca namamu dari atribut seragam sekolah.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "c",
        text: "Menolak sopan tetapi tetap berdiri sendirian di dekat mobilnya",
        isCorrect: false,
        feedback: "Berdiri dekat mobil masih berisiko ditarik paksa. Segera mundur menjauh dan cari tempat ramai yang aman.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-street-2",
    npcId: "street-npc-2",
    npcName: "Pesan Masuk",
    npcType: "stranger",
    mapId: "street",
    category: "Keselamatan Digital",
    calloutText: "Ting! Hai [Nama Anak], ada pesan kejutan spesial masuk di HP-mu!",
    dialogueText: "Hai [Nama Anak]! Aku kakak kelasmu dulu. Ketemuan sekarang yuk, ada hadiah spesial buatmu. Jangan bilang orang tua ya!",
    question: "Bagaimana sikapmu?",
    questionAudioUrl: "/audio/sc_street_2_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Membalas pesan dan setuju bertemu diam-diam demi hadiah",
        isCorrect: false,
        feedback: "Jebakan digital! Kalimat 'jangan bilang orang tua' adalah ciri khas pelaku kejahatan siber untuk memancing anak.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "b",
        text: "Tidak membalas pesan, blokir nomornya, dan lapor ke orang tua",
        isCorrect: true,
        feedback: "Tepat sekali, [Nama Anak]! Blokir nomor asing mencurigakan dan tunjukkan pesannya kepada orang tuamu.",
        feedbackAudioUrl: "/audio/bapak_guru_benar_1.mp3"
      },
      {
        id: "c",
        text: "Memblokir nomornya sendiri tetapi merahasiakannya dari orang tua",
        isCorrect: false,
        feedback: "Memblokir sudah bagus, namun tetap ceritakan ke orang tua agar keamanan HP-mu bisa diperketat bersama.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-street-3",
    npcId: "street-npc-3",
    npcName: "Pejalan Kaki",
    npcType: "stranger",
    mapId: "street",
    category: "Keselamatan di Jalan",
    calloutText: "Hai [Nama Anak], kebetulan searah pulang nih, jalan bareng lewat depan yuk!",
    dialogueText: "Hei [Nama Anak], dari tadi jalan sendirian terus ya? Yuk lewat gang sepi di depan bareng sama aku saja!",
    question: "Apa yang harus kamu lakukan?",
    questionAudioUrl: "/audio/sc_street_3_dialog.mp3",
    options: [
      {
        id: "a",
        text: "Tetap berjalan santai melewati gang sepi bersamanya",
        isCorrect: false,
        feedback: "Sangat berbahaya! Jangan pernah masuk ke gang sepi bersama orang asing yang mengikutimu di jalan.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "b",
        text: "Berlari panik ke tempat sepi tanpa meminta tolong siapapun",
        isCorrect: false,
        feedback: "Menjauh itu benar, tetapi jangan lari ke arah yang sepi. Carilah tempat terang yang ramai orang dewasa.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Masuk ke minimarket atau toko ramai terdekat, minta bantuan, dan hubungi orang tua",
        isCorrect: true,
        feedback: "Cerdas sekali, [Nama Anak]! Tempat ramai seperti minimarket adalah titik aman terbaik untuk meminta pertolongan.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_1.mp3"
      }
    ]
  },
  {
    id: "sc-street-4",
    npcId: "street-npc-4",
    npcName: "Penjual Warung",
    npcType: "stranger",
    mapId: "street",
    category: "Waspada Orang Asing (Stranger Danger)",
    calloutText: "[Nama Anak], mampir warung sini yuk! Ada es krim gratis segar buatmu!",
    dialogueText: "[Nama Anak], sini! Mau es krim gratis? Ambilnya masuk ke gudang belakang warungku dulu ya, jangan bilang siapa-siapa.",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Menolak dengan tegas dan segera lanjut pulang lewat jalan ramai",
        isCorrect: true,
        feedback: "Jempolan, [Nama Anak]! Jajanan gratis dengan syarat masuk ke ruang belakang yang tertutup adalah jebakan berbahaya.",
        feedbackAudioUrl: "/audio/pak_guru_benar_1.mp3"
      },
      {
        id: "b",
        text: "Masuk ke gudang belakang warung demi mendapat es krim gratis",
        isCorrect: false,
        feedback: "Sangat berbahaya! Jangan pernah mau masuk ke ruangan tertutup bersama orang asing dengan alasan apapun.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Menerima es krim gratisnya asalkan tidak masuk ke gudang belakang",
        isCorrect: false,
        feedback: "Makanan atau minuman pemberian orang asing secara mencurigakan tetap tidak aman untuk diterima. Tolak seluruhnya!",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-street-5",
    npcId: "street-npc-5",
    npcName: "Teman Seperjalanan",
    npcType: "peer",
    mapId: "street",
    category: "Waspada Orang Asing (Stranger Danger)",
    calloutText: "Hei [Nama Anak]! Mampir sebentar yuk, ada game baru yang keren banget!",
    dialogueText: "[Nama Anak], mampir ke rumah kenalanku yuk! Banyak game keren di sana, tapi jangan izin orang tua dulu ya nanti dilarang!",
    question: "Bagaimana sikapmu?",
    options: [
      {
        id: "a",
        text: "Ikut mampir tanpa izin orang tua karena diajak teman dekat",
        isCorrect: false,
        feedback: "Jangan ikut! Pergi ke rumah kenalan asing tanpa sepengetahuan orang tua sangat berbahaya bagi kalian berdua.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "b",
        text: "Menolak ikut tetapi membiarkan temanku pergi ke sana sendirian",
        isCorrect: false,
        feedback: "Menolak sudah benar, tetapi ingatkan juga sahabatmu agar tidak pergi sendirian ke rumah orang yang belum dikenal.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Menolak tegas, mengingatkan bahayanya, dan mengajak teman pulang bersama",
        isCorrect: true,
        feedback: "Sahabat sejati, [Nama Anak]! Kamu berhasil menjaga keselamatan dirimu sekaligus melindungi temanmu.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_3.mp3"
      }
    ]
  },

  // ================= MAP 4 — RUMAH (5 Skenario) =================

  {
    id: "sc-home-1",
    npcId: "home-npc-1",
    npcName: "Tamu di Rumah",
    npcType: "stranger",
    mapId: "home",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "Halo [Nama Anak], sudah pulang sekolah ya? Sini duduk ngobrol dekat Om.",
    dialogueText: "Ssshh [Nama Anak], diam saja ya waktu aku sentuh bagian pribadimu. Ini rahasia kita berdua, jangan bilang mama atau papa!",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Segera menjauh keluar ruangan dan langsung melapor ke orang tua",
        isCorrect: true,
        feedback: "Berani sekali, [Nama Anak]! Tidak boleh ada siapapun yang menyentuh area pribadimu. Ingat, ini sama sekali bukan salahmu!",
        feedbackAudioUrl: "/audio/bapak_guru_benar_1.mp3"
      },
      {
        id: "b",
        text: "Diam saja dan menyimpan rahasia itu karena takut dimarahi",
        isCorrect: false,
        feedback: "Jangan takut bercerita! Orang tua pasti melindungimu. Merahasiakannya justru membuat pelaku berani mengulanginya.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Menghindarinya saja di lain hari tanpa pernah bercerita ke orang tua",
        isCorrect: false,
        feedback: "Menghindar saja belum cukup. Ceritakan segera kepada ayah atau ibu agar kamu benar-benar terlindungi.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-home-2",
    npcId: "home-npc-2",
    npcName: "Tablet di Meja",
    npcType: "stranger",
    mapId: "home",
    category: "Keselamatan Digital",
    calloutText: "Ting! Hai [Nama Anak], teman baru dari sekolahmu menyapa di tablet nih!",
    dialogueText: "Hai [Nama Anak], aku kenal kamu dari sekolahmu! Video call sekarang yuk, tapi jauhkan tabletmu dari orang tua dulu ya!",
    question: "Bagaimana sikapmu?",
    options: [
      {
        id: "a",
        text: "Menyalakan video call diam-diam karena dia mengaku kenal sekolahku",
        isCorrect: false,
        feedback: "Hati-hati! Akun asing yang meminta menjauhkan layar dari orang tua adalah tanda bahaya kejahatan siber.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "b",
        text: "Menutup aplikasi dan langsung menunjukkan pesan itu ke orang tua",
        isCorrect: true,
        feedback: "Cerdas sekali, [Nama Anak]! Menunjukkan pesan mencurigakan ke orang tua membuatmu aman saat berinternet.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_4.mp3"
      },
      {
        id: "c",
        text: "Menghapus chat-nya sendiri tanpa memberi tahu orang tua",
        isCorrect: false,
        feedback: "Jangan dihapus diam-diam! Tunjukkan ke orang tua agar akun asing tersebut bisa segera diblokir dan dilaporkan.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-home-3",
    npcId: "home-npc-3",
    npcName: "Kakak Sepupu",
    npcType: "peer",
    mapId: "home",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "[Nama Anak], sini duduk nonton TV bareng Kakak yuk, acaranya lagi seru!",
    dialogueText: "[Nama Anak], udah tonton aja tayangan dewasa di TV ini! Seru kok, tapi awas jangan sampai ayah dan ibumu tahu ya.",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Ikut menonton karena tidak enak menolak ajakan kakak sepupu",
        isCorrect: false,
        feedback: "Beranilah menolak! Tayangan dewasa tidak pantas untuk anak-anak walaupun yang mengajak kerabat sendiri.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "b",
        text: "Pergi ke kamar lain tetapi merahasiakannya dari orang tua",
        isCorrect: false,
        feedback: "Pergi menjauh sudah bagus, tetapi tetap beri tahu ayah dan ibu agar tontonan di rumah tetap aman.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      },
      {
        id: "c",
        text: "Mematikan TV segera lalu menceritakan kejadian itu ke ayah atau ibu",
        isCorrect: true,
        feedback: "Hebat sekali, [Nama Anak]! Kamu tegas menjaga diri dari tontonan buruk dan jujur kepada orang tua.",
        feedbackAudioUrl: "/audio/pak_guru_benar_1.mp3"
      }
    ]
  },
  {
    id: "sc-home-4",
    npcId: "home-npc-4",
    npcName: "Om Kerabat",
    npcType: "stranger",
    mapId: "home",
    category: "Pencegahan Grooming & Batasan Diri",
    calloutText: "Hai [Nama Anak]! Sini deh, Om bawakan hadiah spesial lagi buat kamu!",
    dialogueText: "[Nama Anak], mau Om belikan hadiah keren lagi? Tapi turuti dulu permintaanku ya, dan ini rahasia kita berdua saja.",
    question: "Bagaimana sikapmu?",
    options: [
      {
        id: "a",
        text: "Menolak tegas tawarannya dan segera bercerita kepada orang tua",
        isCorrect: true,
        feedback: "Sangat berani, [Nama Anak]! Hadiah dengan syarat rahasia yang membuat tidak nyaman wajib ditolak dan dilaporkan ke orang tua.",
        feedbackAudioUrl: "/audio/ibu_guru_benar_2.mp3"
      },
      {
        id: "b",
        text: "Menuruti permintaannya karena merasa tidak enak sudah sering diberi hadiah",
        isCorrect: false,
        feedback: "Ingat! Sebanyak apapun hadiah yang pernah diberikan, tidak ada yang berhak meminta rahasia mencurigakan darimu.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_2.mp3"
      },
      {
        id: "c",
        text: "Menolak hadiahnya tetapi memilih diam tanpa bercerita ke orang tua",
        isCorrect: false,
        feedback: "Menolak sudah tepat, namun kamu tetap perlu bercerita ke ayah atau ibu agar mereka bisa menjagamu sepenuhnya.",
        feedbackAudioUrl: "/audio/ibu_guru_bimbingan_1.mp3"
      }
    ]
  },
  {
    id: "sc-home-5",
    npcId: "home-npc-5",
    npcName: "Telepon Rumah",
    npcType: "stranger",
    mapId: "home",
    category: "Keselamatan Di Rumah",
    calloutText: "Kring! Halo [Nama Anak], angkat sebentar yuk, ada kabar dari teman orang tuamu!",
    dialogueText: "Halo [Nama Anak]? Aku teman orang tuamu, mereka lagi ada urusan mendadak. Cepat keluar rumah sekarang ya, aku jemput di depan!",
    question: "Apa yang harus kamu lakukan?",
    options: [
      {
        id: "a",
        text: "Langsung membuka pintu pagar karena dia tahu namaku",
        isCorrect: false,
        feedback: "Jangan buka pintu! Penipu sering memakai alasan darurat dan menyebut namamu agar kamu panik lalu keluar rumah.",
        feedbackAudioUrl: "/audio/pak_guru_bimbingan_1.mp3"
      },
      {
        id: "b",
        text: "Menutup telepon, tetap kunci pintu, dan langsung menelepon orang tua",
        isCorrect: true,
        feedback: "Sempurna, [Nama Anak]! Selalu pastikan pintu terkunci dan hubungi orang tuamu sendiri untuk mengecek kebenarannya.",
        feedbackAudioUrl: "/audio/bapak_guru_benar_1.mp3"
      },
      {
        id: "c",
        text: "Diam saja di kamar tanpa menghubungi orang tua sama sekali",
        isCorrect: false,
        feedback: "Tetap di dalam rumah sudah aman, tetapi segera telepon ayah atau ibu untuk memberi tahu adanya penelepon mencurigakan.",
        feedbackAudioUrl: "/audio/bapak_guru_bimbingan_1.mp3"
      }
    ]
  }
];

export const MAPS: MapData[] = [
  {
    id: "school",
    name: "school",
    title: "Halaman Sekolah (SD Negeri SafeStep)",
    backgroundColor: "bg-[#68B43E]",
    exits: [
      {
        targetMapId: "class",
        label: "Ke Kelas ↑",
        position: { x: 47, y: 11 },
        direction: "up"
      },
      {
        targetMapId: "street",
        label: "Ke Jalan →",
        position: { x: 92, y: 62 },
        direction: "right"
      }
    ],
    npcs: [
      {
        id: "school-npc-1",
        name: "Tamu di Gerbang",
        description: "Zona 1: Dekat gerbang utama & pos satpam sekolah",
        color: "bg-slate-700",
        position: { x: 24, y: 80 },
        scenarioId: "sc-school-1"
      },
      {
        id: "school-npc-2",
        name: "Petugas Sekolah",
        description: "Zona 5: Koridor utama dekat ruang kelas & gudang",
        color: "bg-blue-600",
        position: { x: 62, y: 23 },
        scenarioId: "sc-school-2"
      },
      {
        id: "school-npc-3",
        name: "Teman di Taman",
        description: "Zona 4: Area bangku taman & pohon peneduh",
        color: "bg-orange-400",
        position: { x: 72, y: 81 },
        scenarioId: "sc-school-3"
      },
      {
        id: "school-npc-4",
        name: "Pengunjung Halaman",
        description: "Zona 2: Area rumput utama & podium tiang bendera",
        color: "bg-fuchsia-600",
        position: { x: 23, y: 47 },
        scenarioId: "sc-school-4"
      },
      {
        id: "school-npc-5",
        name: "Kakak Kelas",
        description: "Zona 3: Lapangan olahraga serbaguna",
        color: "bg-red-500",
        position: { x: 74, y: 46 },
        scenarioId: "sc-school-5"
      }
    ]
  },
  {
    id: "class",
    name: "class",
    title: "Ruang Kelas (Kelas 5A)",
    backgroundColor: "bg-[#FAFAF9]",
    exits: [
      {
        targetMapId: "school",
        label: "Keluar Ke Halaman ↓",
        position: { x: 50, y: 92 },
        direction: "down"
      }
    ],
    npcs: [
      {
        id: "class-npc-1",
        name: "Pak Guru Pengganti",
        description: "Guru pengganti di depan kelas",
        color: "bg-emerald-600",
        position: { x: 50, y: 25 },
        scenarioId: "sc-class-1"
      },
      {
        id: "class-npc-2",
        name: "Teman Sebangku",
        description: "Siswa di bangku barisan kiri",
        color: "bg-indigo-500",
        position: { x: 25, y: 45 },
        scenarioId: "sc-class-2"
      },
      {
        id: "class-npc-3",
        name: "Meja Laptop Kelas",
        description: "Laptop sekolah menyala di meja kanan",
        color: "bg-purple-500",
        position: { x: 75, y: 35 },
        scenarioId: "sc-class-3"
      },
      {
        id: "class-npc-4",
        name: "Teman di Pojok Baca",
        description: "Siswi berdiri di area pojok baca",
        color: "bg-sky-500",
        position: { x: 15, y: 65 },
        scenarioId: "sc-class-4"
      },
      {
        id: "class-npc-5",
        name: "Orang di Luar Kelas",
        description: "Seseorang berdiri di dekat jendela luar kelas",
        color: "bg-yellow-600",
        position: { x: 80, y: 65 },
        scenarioId: "sc-class-5"
      }
    ]
  },
  {
    id: "street",
    name: "street",
    title: "Jalan Raya & Perjalanan Pulang",
    backgroundColor: "bg-[#3D4043]",
    exits: [
      {
        targetMapId: "school",
        label: "Ke Halaman Sekolah ←",
        position: { x: 8, y: 50 },
        direction: "left"
      },
      {
        targetMapId: "home",
        label: "Ke Lingkungan Rumah →",
        position: { x: 92, y: 50 },
        direction: "right"
      }
    ],
    npcs: [
      {
        id: "street-npc-1",
        name: "Pengendara Mobil",
        description: "Pengendara mobil berhenti di tepi jalan",
        color: "bg-fuchsia-700",
        position: { x: 45, y: 55 },
        scenarioId: "sc-street-1"
      },
      {
        id: "street-npc-2",
        name: "Pesan Masuk",
        description: "Notifikasi pesan masuk di dekat Toko AmanMart",
        color: "bg-teal-500",
        position: { x: 30, y: 28 },
        scenarioId: "sc-street-2"
      },
      {
        id: "street-npc-3",
        name: "Pejalan Kaki",
        description: "Pejalan kaki di jalur trotoar bawah",
        color: "bg-rose-500",
        position: { x: 23, y: 71 },
        scenarioId: "sc-street-3"
      },
      {
        id: "street-npc-4",
        name: "Penjual Warung",
        description: "Penjual berdiri di depan warung",
        color: "bg-indigo-600",
        position: { x: 58, y: 31 },
        scenarioId: "sc-street-4"
      },
      {
        id: "street-npc-5",
        name: "Teman Seperjalanan",
        description: "Teman sebaya di jalur trotoar pulang",
        color: "bg-amber-500",
        position: { x: 74, y: 73 },
        scenarioId: "sc-street-5"
      }
    ]
  },
  {
    id: "home",
    name: "home",
    title: "Ruang Keluarga & Ruang Tamu (Rumah Aman)",
    backgroundColor: "bg-[#FCFBF9]",
    exits: [
      {
        targetMapId: "street",
        label: "Ke Jalan Raya ←",
        position: { x: 8, y: 50 },
        direction: "left"
      }
    ],
    npcs: [
      {
        id: "home-npc-1",
        name: "Tamu di Rumah",
        description: "Tamu berkunjung di area ruang tamu",
        color: "bg-violet-600",
        position: { x: 74, y: 35 },
        scenarioId: "sc-home-1"
      },
      {
        id: "home-npc-2",
        name: "Tablet di Meja",
        description: "Tablet menyala di atas meja ruang keluarga",
        color: "bg-cyan-500",
        position: { x: 38, y: 70 },
        scenarioId: "sc-home-2"
      },
      {
        id: "home-npc-3",
        name: "Kakak Sepupu",
        description: "Kakak sepupu di depan televisi ruang keluarga",
        color: "bg-red-650",
        position: { x: 50, y: 56 },
        scenarioId: "sc-home-3"
      },
      {
        id: "home-npc-4",
        name: "Om Kerabat",
        description: "Kerabat berdiri di dekat tangga rumah",
        color: "bg-stone-700",
        position: { x: 22, y: 62 },
        scenarioId: "sc-home-4"
      },
      {
        id: "home-npc-5",
        name: "Telepon Rumah",
        description: "Telepon berdering di meja sudut ruangan",
        color: "bg-pink-600",
        position: { x: 60, y: 78 },
        scenarioId: "sc-home-5"
      }
    ]
  }
];

export const NEUTRAL_NPC_LABELS: Record<string, string> = {
  "school-npc-1": "Tamu di Gerbang",
  "school-npc-2": "Petugas Sekolah",
  "school-npc-3": "Teman di Taman",
  "school-npc-4": "Pengunjung Halaman",
  "school-npc-5": "Kakak Kelas",
  "class-npc-1": "Pak Guru Pengganti",
  "class-npc-2": "Teman Sebangku",
  "class-npc-3": "Meja Laptop Kelas",
  "class-npc-4": "Teman di Pojok Baca",
  "class-npc-5": "Orang di Luar Kelas",
  "street-npc-1": "Pengendara Mobil",
  "street-npc-2": "Pesan Masuk",
  "street-npc-3": "Pejalan Kaki",
  "street-npc-4": "Penjual Warung",
  "street-npc-5": "Teman Seperjalanan",
  "home-npc-1": "Tamu di Rumah",
  "home-npc-2": "Tablet di Meja",
  "home-npc-3": "Kakak Sepupu",
  "home-npc-4": "Om Kerabat",
  "home-npc-5": "Telepon Rumah",
};

const LEGACY_SPOILER_NAMES = new Set([
  "Orang Asing di Gerbang",
  "Staf Sekolah Mencurigakan",
  "Teman Berperilaku Tidak Pantas",
  "Penawaran Hadiah dari Orang Asing",
  "Senior Mengancam",
  "Guru Pengganti Mencurigakan",
  "Teman Tunjukkan Konten Tidak Pantas",
  "Laptop Chat Mencurigakan",
  "Ajakan ke Tempat Tersembunyi",
  "Orang Asing Foto ke Dalam Kelas",
  "Tawaran Tumpangan",
  "Pesan HP dari Nomor Asing",
  "Orang Dewasa Mengikuti",
  "Tawaran dari Penjual",
  "Ajakan ke Rumah Orang Asing",
  "Tamu Dewasa Mencurigakan",
  "Chat Media Sosial Mencurigakan",
  "Tontonan Tidak Pantas",
  "Rayuan Hadiah dari Kerabat",
  "Telepon dari Nomor Tidak Dikenal",
]);

const INSPECTION_OBJECT_NPC_IDS = new Set([
  "class-npc-3",
  "class-npc-5",
  "street-npc-2",
  "home-npc-2",
  "home-npc-5",
]);

export function getNpcIndicatorGlyph(npcId: string): "!" | "?" {
  return INSPECTION_OBJECT_NPC_IDS.has(npcId) ? "?" : "!";
}

const LEGACY_NARRATOR_PREFIX_RE =
  /^(Di dekat gerbang|Saat berada di|Saat kamu berada|Saat bersantai|Di halaman rumput|Di lapangan olahraga|Semua teman sudah pulang|Teman sebangkumu berbisik|Kamu melihat|Saat berjalan pulang|HP-mu berbunyi|Kamu sadar ada|Pemilik warung|Temanmu mengajakmu|Seorang kerabat|Ada permintaan pertemanan|Saat menonton TV|Kerabat yang sering|HP-mu berdering)/i;

const DEFAULT_SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  DEFAULT_SCENARIOS.map((sc) => [sc.id, sc])
);

function stripOuterQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("“") && trimmed.endsWith("”"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const DEFAULT_SCENARIO_BY_NPC_ID: Record<string, Scenario> = Object.fromEntries(
  DEFAULT_SCENARIOS.map((sc) => [sc.npcId, sc])
);

export function getScenarioCalloutText(
  scenario: Scenario | undefined | null,
  npcId: string,
  playerName?: string
): string {
  const cleanPlayerName = (playerName || "").trim() || "Teman";
  const defaultByNpc = DEFAULT_SCENARIO_BY_NPC_ID[npcId];
  const rawTemplate =
    (scenario?.calloutText || "").trim() ||
    (defaultByNpc?.calloutText || "").trim() ||
    "Halo [Nama Anak]! Sini sebentar yuk, ada sesuatu buatmu!";

  return rawTemplate.replaceAll("[Nama Anak]", cleanPlayerName);
}

export function normalizeScenarioLabels(list: Scenario[]): Scenario[] {
  return list.map((sc) => {
    const neutralName = NEUTRAL_NPC_LABELS[sc.npcId];
    const resolvedName =
      neutralName && (!sc.npcName || LEGACY_SPOILER_NAMES.has(sc.npcName.trim()))
        ? neutralName
        : sc.npcName;

    const defaultSc = DEFAULT_SCENARIO_BY_ID[sc.id] || DEFAULT_SCENARIO_BY_NPC_ID[sc.npcId];
    const resolvedCallout =
      (sc.calloutText || "").trim() || defaultSc?.calloutText || "";
    const rawDialogue = (sc.dialogueText || "").trim();
    const isLegacyNarratorDefault =
      Boolean(defaultSc) &&
      (LEGACY_NARRATOR_PREFIX_RE.test(rawDialogue) ||
        (rawDialogue.startsWith("'") && rawDialogue.endsWith("'")));

    if (isLegacyNarratorDefault && defaultSc) {
      const normalizedItem: Scenario = {
        ...sc,
        npcName: resolvedName || defaultSc.npcName,
        dialogueText: defaultSc.dialogueText,
        question: defaultSc.question,
        options: defaultSc.options,
      };
      if (resolvedCallout) normalizedItem.calloutText = resolvedCallout;
      else delete normalizedItem.calloutText;

      const audioUrl = sc.questionAudioUrl || defaultSc.questionAudioUrl;
      if (audioUrl) normalizedItem.questionAudioUrl = audioUrl;
      else delete normalizedItem.questionAudioUrl;

      return normalizedItem;
    }

    // If a custom scenario still includes a narrator lead-in like "... berkata: '...'", extract the direct quote
    const quotedMatch = rawDialogue.match(/:\s*['"“]([\s\S]+?)['"”]$/);
    const cleanedDialogue = quotedMatch
      ? stripOuterQuotes(quotedMatch[1])
      : stripOuterQuotes(rawDialogue);

    const isSameDefaultDialogue = Boolean(
      defaultSc && cleanedDialogue === defaultSc.dialogueText
    );
    const resolvedAudioUrl =
      sc.questionAudioUrl || (isSameDefaultDialogue ? defaultSc?.questionAudioUrl : undefined);

    const normalizedItem: Scenario = {
      ...sc,
      npcName: resolvedName,
      dialogueText: cleanedDialogue,
    };
    if (resolvedCallout) normalizedItem.calloutText = resolvedCallout;
    else delete normalizedItem.calloutText;

    if (resolvedAudioUrl) normalizedItem.questionAudioUrl = resolvedAudioUrl;
    else delete normalizedItem.questionAudioUrl;

    return normalizedItem;
  });
}

