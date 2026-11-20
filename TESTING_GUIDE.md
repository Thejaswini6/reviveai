# 🧪 ReviveAI Testing Guide

Complete testing checklist before demo and submission.

---

## ✅ Pre-Demo Checklist

### Environment Setup
- [ ] Both servers running (client on :5173, server on :5000)
- [ ] No console errors in browser DevTools
- [ ] Database loaded with 25 mock leads
- [ ] Browser cache cleared for fresh experience

### Visual Verification
- [ ] Dashboard loads without errors
- [ ] All 4 pages accessible (Dashboard, Approvals, Analytics, Lead Detail)
- [ ] Navigation highlights active page
- [ ] Logo and branding visible
- [ ] Status badge shows server connection

---

## 🎯 Feature Testing

### 1. Enhanced Dashboard

#### Search Functionality
- [ ] Type "Rajesh" → filters to Rajesh Kumar
- [ ] Type "corporate" → shows corporate clients
- [ ] Type "installation" → shows installation-related leads
- [ ] Type gibberish → shows "No leads found" message
- [ ] Clear search → shows all leads again
- [ ] Search is case-insensitive

#### Status Filters
- [ ] Select "New" → shows only new leads
- [ ] Select "Contacted" → filters correctly
- [ ] Select "Stale" → shows 11 stale leads
- [ ] Select "Approved" → shows approved leads
- [ ] Select "Recovered" → shows 2 recovered leads
- [ ] Select "Opted-Out" → shows 2 opted-out leads
- [ ] Select "Declined" → shows 3 declined leads
- [ ] "All" button resets filter

#### Revenue Filters
- [ ] Select "₹0 - ₹25K" → shows smaller deals
- [ ] Select "₹25K - ₹50K" → shows medium deals
- [ ] Select "₹50K+" → shows high-value deals (2 leads)
- [ ] "All" button resets filter

#### Source Filters
- [ ] Select "Website" → filters by source
- [ ] Select "Referral" → filters by source
- [ ] Select "Email Campaign" → filters by source
- [ ] Select "Walk-in" → filters by source
- [ ] Select "Phone" → filters by source
- [ ] "All" button resets filter

#### Combined Filters
- [ ] Search + Status filter works
- [ ] Search + Revenue filter works
- [ ] Status + Revenue + Source all work together
- [ ] Filters update lead count accurately

### 2. Lead Scoring

#### Visual Display
- [ ] All leads show priority scores
- [ ] Scores range from 0-100
- [ ] High priority (80-100) shows green badge
- [ ] Medium priority (50-79) shows yellow badge
- [ ] Low priority (0-49) shows orange badge

#### Score Accuracy
- [ ] High-value leads have higher scores
- [ ] Recent leads score higher than old leads
- [ ] Stale leads have appropriate scores
- [ ] Corporate clients (₹50K+) score 80+

### 3. Bulk Operations

#### Selection
- [ ] Click checkbox on individual lead
- [ ] Selected lead highlights with blue border
- [ ] Checkbox shows checkmark when selected
- [ ] Click "Select All" → all visible leads selected
- [ ] Click "Deselect All" → all checkboxes cleared
- [ ] Selection count updates accurately

#### Bulk Analyze
- [ ] Select 2-3 leads
- [ ] Click "Analyze Selected (X)" button
- [ ] Toast notification shows success
- [ ] Message includes count of leads
- [ ] Can select across filtered results

### 4. CSV Export

#### Basic Export
- [ ] Click "Export CSV" button
- [ ] File downloads automatically
- [ ] Filename includes date (leads_export_YYYY-MM-DD.csv)
- [ ] File opens in Excel/Google Sheets

#### Export Content
- [ ] CSV includes all visible (filtered) leads
- [ ] All columns present: Name, Company, Service, Status, Revenue, Score, Source, Last Contact
- [ ] Data matches dashboard display
- [ ] Special characters handled correctly
- [ ] Currency symbols display properly

#### Filtered Export
- [ ] Apply filters → export → only filtered leads included
- [ ] Search → export → only matching leads included
- [ ] Empty results → export shows headers only

### 5. Toast Notifications

#### Visual Appearance
- [ ] Toast appears in top-right corner
- [ ] Success toasts are green with checkmark
- [ ] Error toasts are red with X icon
- [ ] Warning toasts are yellow with warning icon
- [ ] Info toasts are blue with info icon

#### Functionality
- [ ] Bulk analyze triggers success toast
- [ ] Export CSV triggers success toast
- [ ] AI analysis triggers appropriate toast
- [ ] Multiple toasts stack vertically
- [ ] Toasts auto-dismiss after 5 seconds
- [ ] Click toast to dismiss immediately
- [ ] Dismiss button (X) works

#### Multiple Notifications
- [ ] Trigger 3-4 actions quickly
- [ ] All toasts appear and stack
- [ ] Each dismisses independently
- [ ] No overlapping or visual glitches

### 6. Dark Mode

#### Toggle Functionality
- [ ] Click "Dark" button in sidebar footer
- [ ] Theme switches to dark mode
- [ ] Button changes to "Light" with sun icon
- [ ] Click "Light" → switches back
- [ ] Smooth transition animation

#### Visual Consistency
- [ ] All pages support dark mode
- [ ] Dashboard cards readable
- [ ] Tables have proper contrast
- [ ] Buttons visible and styled correctly
- [ ] Text readable everywhere
- [ ] Status badges visible

#### Persistence
- [ ] Enable dark mode
- [ ] Refresh page → still in dark mode
- [ ] Close and reopen browser → preference saved
- [ ] Works across different browser tabs

---

## 📱 Responsive Design Testing

### Desktop (1920x1080)
- [ ] Full sidebar visible with labels
- [ ] Dashboard shows full table
- [ ] All filters visible inline
- [ ] Proper spacing and layout

### Tablet (768px)
- [ ] Sidebar collapses to icons only
- [ ] Dashboard remains usable
- [ ] Filters may wrap
- [ ] Touch targets adequate

### Mobile (375px)
- [ ] Sidebar shows icons only
- [ ] Dashboard scrollable
- [ ] Filters stack vertically
- [ ] Buttons touch-friendly
- [ ] Text readable

---

## 🔍 Browser Compatibility

### Chrome (Recommended)
- [ ] All features work
- [ ] Smooth animations
- [ ] CSV export works
- [ ] LocalStorage persists

### Firefox
- [ ] All features work
- [ ] Dark mode correct
- [ ] Download works

### Edge
- [ ] All features work
- [ ] Compatible with Chromium

### Safari (if available)
- [ ] iOS compatibility
- [ ] LocalStorage works

---

## 🎯 Core Workflow Testing

### Lead Analysis Workflow
1. [ ] Open dashboard
2. [ ] Click "View Details" on stale lead
3. [ ] See lead detail page with full history
4. [ ] Click "Analyze Lead" button
5. [ ] AI analyzes (mock mode shows instant result)
6. [ ] See analysis summary
7. [ ] Navigate to Approval Queue
8. [ ] See pending action
9. [ ] Review suggested message
10. [ ] Click "Approve"
11. [ ] Toast notification confirms
12. [ ] Lead status updates

### Navigation Testing
- [ ] Dashboard → Lead Detail works
- [ ] Lead Detail → Back to Dashboard works
- [ ] All nav items clickable
- [ ] Active page highlighted
- [ ] No broken links

### Analytics Page
- [ ] Summary cards show correct metrics
- [ ] Charts render (if implemented)
- [ ] Revenue calculations accurate
- [ ] Recovery rate displayed

---

## 🐛 Error Handling

### Network Errors
- [ ] Disconnect backend → appropriate error shown
- [ ] Reconnect → status badge updates
- [ ] Graceful degradation

### Empty States
- [ ] No leads matching filter → helpful message
- [ ] No pending approvals → empty state shown
- [ ] No selections → bulk button disabled

### Edge Cases
- [ ] Export with no results → CSV with headers only
- [ ] Select all with 0 results → nothing happens
- [ ] Rapid clicking → no duplicate actions
- [ ] Long lead names → truncated properly
- [ ] Special characters in search → no crash

---

## 📊 Performance Testing

### Load Time
- [ ] Initial page load < 2 seconds
- [ ] Search filters instantly (< 100ms)
- [ ] Page transitions smooth
- [ ] No lag when selecting leads

### Memory
- [ ] No memory leaks after prolonged use
- [ ] Can switch pages multiple times
- [ ] Dark mode toggle doesn't slow down

### Data Handling
- [ ] 25 leads load quickly
- [ ] Filtering remains fast
- [ ] Bulk operations on 10+ leads works

---

## 🎥 Demo Recording Checklist

### Pre-Recording
- [ ] Clear browser history and cache
- [ ] Close unnecessary tabs
- [ ] Hide bookmarks bar
- [ ] Full screen mode
- [ ] Good lighting (if showing face)
- [ ] Mic test

### Recording Sequence
1. [ ] Show dashboard with all features
2. [ ] Demonstrate search functionality
3. [ ] Show multiple filters in action
4. [ ] Highlight lead scoring
5. [ ] Perform bulk selection and analyze
6. [ ] Toggle dark mode
7. [ ] Export to CSV and open file
8. [ ] Navigate to approval queue
9. [ ] Approve an action with toast
10. [ ] Show analytics page
11. [ ] Navigate to lead detail
12. [ ] Show mobile responsive view

### Video Quality
- [ ] 1080p minimum resolution
- [ ] Clear audio narration
- [ ] No background noise
- [ ] Smooth transitions
- [ ] 2-3 minutes duration
- [ ] Add captions if required

---

## 📸 Screenshot Checklist

### Required Screenshots

1. **Dashboard - Full View**
   - [ ] Light mode, all leads visible
   - [ ] Status: Captured

2. **Dashboard - Filtered**
   - [ ] Show filters in action
   - [ ] Some leads filtered out
   - [ ] Status: Captured

3. **Lead Scoring**
   - [ ] Close-up of colored score badges
   - [ ] Green, yellow, orange visible
   - [ ] Status: Captured

4. **Bulk Selection**
   - [ ] Multiple leads selected
   - [ ] Checkboxes checked
   - [ ] "Analyze Selected" button
   - [ ] Status: Captured

5. **Toast Notifications**
   - [ ] 2-3 toasts stacked
   - [ ] Different colors visible
   - [ ] Status: Captured

6. **Dark Mode**
   - [ ] Full dashboard in dark mode
   - [ ] Readable and attractive
   - [ ] Status: Captured

7. **CSV Export**
   - [ ] Excel/Sheets with exported data
   - [ ] All columns visible
   - [ ] Status: Captured

8. **Lead Detail Page**
   - [ ] Full customer profile
   - [ ] Timeline visible
   - [ ] Status: Captured

9. **Approval Queue**
   - [ ] Pending actions shown
   - [ ] AI message preview
   - [ ] Status: Captured

10. **Analytics Dashboard**
    - [ ] Metrics cards visible
    - [ ] Clean and professional
    - [ ] Status: Captured

11. **Mobile View**
    - [ ] Responsive design shown
    - [ ] Usable on small screen
    - [ ] Status: Captured

### Screenshot Guidelines
- [ ] 1920x1080 resolution minimum
- [ ] Hide personal information
- [ ] Crop unnecessary browser chrome
- [ ] Consistent branding
- [ ] Professional appearance
- [ ] Good contrast and clarity

---

## ✅ Final Submission Checklist

### Code Quality
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Clean, commented code
- [ ] Proper file organization

### Documentation
- [ ] README.md updated with new features
- [ ] HACKATHON_SUBMISSION.md complete
- [ ] NEW_FEATURES.md created
- [ ] DEMO_GUIDE.md accurate
- [ ] All links work

### Assets
- [ ] All 11 screenshots captured
- [ ] Demo video recorded (2-3 min)
- [ ] Video uploaded (YouTube/Vimeo)
- [ ] Screenshots organized in folder

### Testing
- [ ] All features tested
- [ ] All browsers checked
- [ ] Mobile responsive verified
- [ ] Performance acceptable

### Submission Form
- [ ] Project name: ReviveAI
- [ ] Tagline written
- [ ] Description complete
- [ ] Video URL added
- [ ] Screenshots attached
- [ ] GitHub repo link
- [ ] Live demo link (if deployed)
- [ ] Team member info
- [ ] GoDaddy integration explained

---

## 🚨 Common Issues & Fixes

### Issue: Servers not starting
**Fix**: Check ports 5173 and 5000 are free, restart with `npm run dev`

### Issue: Dark mode not persisting
**Fix**: Check localStorage not disabled in browser, try incognito to test

### Issue: CSV export not downloading
**Fix**: Check browser download settings, allow popups for localhost

### Issue: Toasts not appearing
**Fix**: Verify ToastProvider wraps App in main.tsx, check console for errors

### Issue: Filters not working
**Fix**: Clear browser cache, verify DashboardEnhanced is being used

### Issue: Lead scoring showing wrong colors
**Fix**: Check CSS for dark mode overrides, verify score calculation logic

---

## 📞 Support During Demo

If something breaks during demo:

1. **Stay Calm**: Acknowledge the issue professionally
2. **Have Backup**: Screenshots and video as backup
3. **Explain**: "This works in our test environment, let me show you the recording"
4. **Continue**: Move to next feature
5. **Fix Later**: Don't waste demo time debugging

---

## 🎓 Demo Tips

1. **Practice**: Run through 5+ times before actual demo
2. **Timing**: Aim for 2-3 minutes, max 5 minutes
3. **Story**: Show the problem → solution → impact
4. **Energy**: Be enthusiastic but professional
5. **Preparation**: Have notes, but don't read them
6. **Questions**: Anticipate judge questions
7. **Backup**: Have screenshots if live demo fails

---

## 🏆 Success Criteria

Your demo is ready when:

- ✅ All 6 new features work flawlessly
- ✅ No console errors
- ✅ Smooth, professional appearance
- ✅ Fast performance
- ✅ You can explain every feature in 30 seconds
- ✅ Video and screenshots captured
- ✅ Documentation complete
- ✅ You're confident and prepared

---

**Good luck! 🚀**

*Built for GoDaddy Inclusive Innovation Hackathon 2026*
