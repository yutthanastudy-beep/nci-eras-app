# คู่มือการติดตั้งและ Deploy เว็บแอป ERAS บน Cloudflare Pages & Cloudflare D1 Database

ระบบได้เตรียมซอร์สโค้ด ฝั่ง Serverless API (`functions/api/patients.js`), ฐานข้อมูล Cloudflare D1 (`schema.sql`), และการตั้งค่า (`wrangler.toml`) ไว้อย่างสมบูรณ์เรียบร้อยแล้ว

---

##  วิธีที่ 1: Deploy ผ่าน Cloudflare Dashboard (ง่ายที่สุด ไม่ต้องลงโปรแกรม)

### ขั้นตอนที่ 1: สร้าง Cloudflare D1 Database (ฐานข้อมูล SQL บน Cloudflare)
1. เข้าสู่ระบบ [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. ที่เมนูด้านซ้าย เลือก **Workers & Pages** $\rightarrow$ **D1 SQL Database**
3. คลิก **Create database**
   - ตั้งชื่อ Database: `nci-eras-db`
   - คลิก **Create**
4. เมื่อสร้างเสร็จแล้ว คลิกเข้าที่ `nci-eras-db` $\rightarrow$ เลือกแท็บ **Console**
5. คัดลอกคำสั่งในไฟล์ [`schema.sql`](file:///Users/yutthana/ERAS/schema.sql) ไปวางใน Console แล้วกด **Execute** เพื่อสร้างตารางข้อมูล `patients`

---

### ขั้นตอนที่ 2: Deploy เว็บแอปขึ้น Cloudflare Pages
1. ใน Cloudflare Dashboard ที่เมนูด้านซ้าย เลือก **Workers & Pages** $\rightarrow$ **Overview**
2. คลิก **Create application** $\rightarrow$ เลือกแท็บ **Pages**
3. เลือกได้ 2 แบบ:
   - **Upload assets (ดึงโฟลเดอร์ลากวาง):** ซิปโฟลเดอร์ `/Users/yutthana/ERAS` (หรือลากวางไฟล์ทั้งหมด) แล้วอัปโหลดได้ทันที
   - **Connect to Git:** เชื่อมต่อ GitHub Repository ของคุณ
4. ตั้งชื่อ Project เช่น `nci-eras-app` แล้วกด **Save and Deploy**

---

### ขั้นตอนที่ 3: เชื่อมต่อ Cloudflare D1 Database เข้ากับ Web Application
1. เมื่อ Deploy เรียบร้อยแล้ว เข้าไปที่โปรเจกต์ของคุณใน **Pages** $\rightarrow$ เลือกแท็บ **Settings**
2. เลือกเมนู **Functions** ด้านซ้าย
3. เลื่อนลงมาที่หัวข้อ **D1 database bindings** $\rightarrow$ คลิก **Add binding**
   - **Variable name:** พิมพ์ `DB` (ตัวพิมพ์ใหญ่ตรงตามโค้ด)
   - **D1 database:** เลือก `nci-eras-db`
4. คลิก **Save**
5. ไปที่แท็บ **Deployments** $\rightarrow$ คลิก **Retry deployment** หรือสั่ง Redeploy 1 ครั้ง
6. **เสร็จสิ้น!** เว็บแอป ERAS ของคุณพร้อมใช้งานออนไลน์ทั่วโลกผ่าน URL `https://nci-eras-app.pages.dev` พร้อมเชื่อมต่อ Cloudflare D1 Database เรียบร้อยแล้ว!

---

## ⚡ วิธีที่ 2: Deploy ผ่าน Wrangler CLI (ด้วย Terminal)

หากในเครื่องติดตั้ง Node.js เรียบร้อยแล้ว สามารถสั่งงานด้วยคำสั่งง่ายๆ เพียง 4 ขั้นตอน:

```bash
# 1. เข้าสู่ระบบ Cloudflare
npx wrangler login

# 2. สร้าง Cloudflare D1 Database
npx wrangler d1 create nci-eras-db

# (นำ database_id ที่ได้จากคำสั่งด้านบน ไปใส่ใน wrangler.toml)

# 3. รัน Schema SQL สร้างตารางข้อมูลใน D1
npx wrangler d1 execute nci-eras-db --file=./schema.sql

# 4. Deploy เว็บแอปขึ้น Cloudflare Pages
npx wrangler pages deploy . --project-name=nci-eras-app
```

---

##  ไฟล์ที่จัดเตรียมไว้ในโปรเจกต์:
- [`schema.sql`](file:///Users/yutthana/ERAS/schema.sql) : ไฟล์ SQL โครงสร้างฐานข้อมูล D1
- [`functions/api/patients.js`](file:///Users/yutthana/ERAS/functions/api/patients.js) : Serverless REST API บน Cloudflare Pages Functions
- [`wrangler.toml`](file:///Users/yutthana/ERAS/wrangler.toml) : ไฟล์คอนฟิก Cloudflare Wrangler
- [`js/patient-store.js`](file:///Users/yutthana/ERAS/js/patient-store.js) : โค้ดเชื่อมต่อ Cloudflare D1 API แบบไฮบริด (Sync Cloud + Backup LocalStorage)
