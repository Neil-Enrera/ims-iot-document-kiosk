# Frontend Deployment Guide

> **Task:** TASK-DEPLOYMENT-005
> **Date:** July 31, 2026

---

## 1. Prerequisites

- Angular CLI installed
- Backend running and accessible
- Production environment configured

---

## 2. Environment Configuration

Update `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api'
};
```

---

## 3. Production Build

```bash
cd ims-iot-document-kiosk
ng build --configuration production
```

Expected output:
```
dist/ims-iot-document-kiosk/browser/
├── index.html
├── main.*.js
├── polyfills.*.js
├── styles.*.css
└── assets/
```

---

## 4. Deploy to Production

### Option A: Static File Server
```bash
# Copy dist to production directory
xcopy /E /I dist\ims-iot-document-kiosk\browser C:\BarangayIMS\frontend

# Serve with a static server (e.g., http-server)
npx http-server C:\BarangayIMS\frontend -p 4200
```

### Option B: IIS / nginx
Configure the web server to serve the Angular build files from `C:\BarangayIMS\frontend\`.

---

## 5. Verification

### Staff Portal
1. Open `http://localhost:4200` in Chrome
2. Login with `admin` / `admin123`
3. Verify dashboard loads
4. Navigate through all modules

### Kiosk Interface
1. Open `http://localhost:4200/kiosk`
2. Verify idle/search screen loads
3. Test resident search
4. Test service selection
5. Test request submission

---

## 6. Browser Configuration (Kiosk)

Configure Chrome for kiosk mode:
```
chrome.exe --kiosk http://localhost:4200/kiosk
```

Or create a shortcut with:
- Target: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://localhost:4200/kiosk`
- Check "Run maximized"

---

## 7. Validation Checklist

- [ ] Production build successful
- [ ] Environment configured
- [ ] Frontend accessible
- [ ] Login works
- [ ] Dashboard loads
- [ ] All modules accessible
- [ ] Kiosk interface works
- [ ] API communication verified

---

*Document created: July 31, 2026*
