# Siddhan Employee Logs - Demo Instructions

> **Live URL:** https://insertion-miami-participation-enhancements.trycloudflare.com

---

## Quick Access

| Service | URL |
|---|---|
| Admin Dashboard | https://insertion-miami-participation-enhancements.trycloudflare.com |
| API Docs (Swagger) | https://insertion-miami-participation-enhancements.trycloudflare.com/api/docs |
| DB Admin | https://insertion-miami-participation-enhancements.trycloudflare.com/db/ |

**Admin Login:** `admin@siddhan.com` / `Siddhan@123`

---

## Demo Flow: Add Employee → 360° Face Scan → Mark Attendance

### Step 1: Login to Admin Dashboard

1. Open the Admin Dashboard URL above
2. Login with admin credentials
3. You'll land on the Dashboard page

### Step 2: Add a New Employee

1. Click **"Employees"** in the left sidebar
2. Click **"Add Employee"** button
3. Fill the 2-column form:

   | Field | Example |
   |---|---|
   | Employee ID | `EMP100` |
   | Full Name | `Your Name` |
   | Email | `yourname@example.com` |
   | Phone | `919876543210` |
   | Gender | Male / Female / Other |
   | Designation | `Developer` |

4. Click **"Create"**

> Employee will receive login credentials (email + password set by admin).

### Step 3: Start the Kiosk App

```bash
cd kiosk_app
flutter pub get
flutter run
```

1. **Login Screen** appears — login with admin credentials (`admin@siddhan.com` / `Siddhan@123`)
2. Kiosk enters scanning mode with live camera

### Step 4: Face Detection → Auto Attendance

1. Position the registered employee's face in front of the camera
2. Within ~2.5 seconds, the system will:
   - Capture a frame
   - Send to backend (`POST /api/v1/face/detect-and-mark`)
   - Match against stored face encodings
   - Draw **head-focused rectangles**:
     - **Green** = recognized employee (name + confidence %)
     - **Red** = unknown person
3. If matched (≥80% confidence):
   - **Welcome overlay** with employee name
   - **Gender-based avatar** (blue for male, pink for female)
   - Attendance auto-marked as check-in
   - Daily face capture saved for 5-day rolling training

### Step 5: Check-Out and Re-Check-In

1. Same employee faces the camera again → **Check-Out** is marked
2. If they try a third time → **"Already checked out"** screen appears
3. Option to **"Check In Again"** or **"No Thanks"**

### Step 6: 360° Face Registration (Employee App)

```bash
cd employee_app
flutter pub get
flutter run
```

1. Login as the employee created in Step 2
2. On first login, **360° Face Registration** opens
3. Capture 7 angles: Front → Left 45° → Left 90° → Right 45° → Right 90° → Up → Down
4. Each angle validated server-side
5. Progress: 0% → 100%

### Step 7: Profile Edit (Employee App)

1. Go to **Profile** tab
2. See gender, designation, and other details
3. Tap the **pencil icon** on the profile photo to re-register face

### Step 8: Admin Logout (Kiosk)

1. When the admin's face is detected on the kiosk, a **logout button** appears
2. Tap it → confirmation dialog → clears session → returns to login screen

### Step 9: Verify in Admin Dashboard

1. Go to the Admin Dashboard
2. Click **"Attendance"** → see the employee's record
3. Click **"Dashboard"** → see real-time activity feed

### Step 10: DB Admin

1. Open the DB Admin URL above
2. Browse tables: `employees`, `check_logs`, `face_photos`, `kiosk_logs`
3. Edit/delete rows directly
4. Run raw SQL queries in the SQL Console

---

## Kiosk Screen States

```
SCANNING         → Camera active, looking for faces
WELCOME          → Employee recognized, check-in marked
ALREADY IN       → Employee already checked in today
ALREADY OUT      → Checked out — option to re-check-in
```

---

## Stopping the System

```bash
# Stop the container
docker stop siddhan-prod

# Stop the tunnel
# Press Ctrl+C in the cloudflared terminal

# Restart
docker start siddhan-prod
cloudflared tunnel --url http://localhost:10000
```

---

## API Testing (via curl)

```bash
BASE=https://insertion-miami-participation-enhancements.trycloudflare.com

# Health
curl $BASE/health

# Login
curl -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siddhan.com","password":"Siddhan@123"}'

# Detect and mark (with photo)
curl -X POST $BASE/api/v1/face/detect-and-mark \
  -F "file=@/path/to/photo.jpg"
```
