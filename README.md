# 1584 Case Console

เว็บแดชบอร์ด (PWA) สำหรับจัดการเคสแจ้งเบาะแสจราจรที่เข้ามาทาง LINE — ดูหลักฐาน แก้ไขทะเบียน/ข้อหา และติดตามสถานะ

## โครงสร้าง

| ไฟล์ | หน้าที่ |
|---|---|
| index.html | ทั้งแอป (HTML + CSS + JS) ไม่มี build step |
| manifest.json | ข้อมูล PWA (ชื่อ ไอคอน สี) |
| sw.js | Service worker — cache หน้าเว็บและไอคอน ไม่แตะ /api |
| icons/ | ไอคอน 192 / 512 / maskable / apple-touch |

## การทำงาน

```
เบราว์เซอร์ → Cloudflare Worker (/api) → Google Apps Script → Google Sheets + Drive
```

- อ่านข้อมูล: GET /api?action=getData
- เขียนข้อมูล: POST /api  body = { action, payload }
- ตัวแปร GAS_URL ใน index.html (ต้นสคริปต์) คือปลายทางของ Worker

## ขึ้น GitHub Pages

1. push ไฟล์ทั้งหมดขึ้น repo
2. Settings → Pages → Source: Deploy from a branch → main / (root)
3. เปิด https://<user>.github.io/<repo>/

ทุก path เป็น relative (./) จึงใช้ได้ทั้งโดเมนหลักและ subpath

## ความปลอดภัย — อ่านก่อนใช้จริง

**ถ้ายังไม่ตั้ง DASHBOARD_KEY: /api ไม่มีการตรวจสิทธิ์เลย** ใครรู้ URL ของ Worker ก็เรียก getData อ่านเคสทั้งหมดได้ (ทะเบียน พิกัด ที่อยู่) และสั่ง deleteRecord ลบข้อมูลได้

PIN 4 หลักในหน้าเว็บเป็นเพียงการกันคนเปิดดูเฉย ๆ **ไม่ใช่การรักษาความปลอดภัย** เพราะ

- เป็นการตรวจฝั่งเบราว์เซอร์ ข้ามได้
- hash ของ PIN อยู่ในไฟล์ brute force 10,000 รูปแบบได้ในไม่กี่วินาที

### การป้องกันที่มีอยู่

หน้าเว็บมีระบบ **access key**: ครั้งแรกที่เปิด (หรือเมื่อรหัสผิด) จะมีหน้าต่างให้กรอก
รหัสถูกเก็บใน localStorage ของเครื่องนั้น ไม่เคยอยู่ใน repo

เปิดใช้จริง (ทำ 3 อย่าง):

1. Apps Script → run `setConfig('DASHBOARD_KEY', '<รหัสสุ่มยาว>')`
2. Apps Script → run `setConfig('DASHBOARD_AUTH', 'key')` → deploy version ใหม่
3. เปิดเว็บ → กรอกรหัสครั้งเดียว

ถ้ายังไม่ตั้ง `DASHBOARD_KEY` ระบบจะทำงานแบบไม่ต้องใช้รหัส (เหมือนเดิม) — ตั้งเมื่อพร้อม

ถ้ากรอกรหัสผิดค้างไว้ เปิด DevTools แล้วสั่ง
`localStorage.removeItem('tic.accessKey')` แล้วโหลดหน้าใหม่

หมายเหตุ: PIN 4 หลักยังอยู่แยกต่างหาก เป็นเพียงการกันคนเปิดดูหน้าเว็บ ไม่ได้ป้องกัน API

### กติกา

- **ห้าม commit** token, channel secret หรือไฟล์สำรองที่มีข้อมูลจริง
- ไฟล์ใน icons/ และ manifest.json เป็น public โดยธรรมชาติ อย่าใส่ข้อมูลส่วนตัว
- ลิงก์รูปหลักฐานเป็นแบบ anyone-with-link — ใครมีลิงก์ก็เปิดได้ อย่าแชร์ลิงก์เคสออกนอกทีม

## พัฒนาต่อ

ไม่มี dependency ภายนอกนอกจาก Google Fonts — เปิด index.html แล้วแก้ได้เลย
แก้ CACHE_VERSION ใน sw.js เมื่อออกเวอร์ชันใหม่ เพื่อล้าง cache เก่า