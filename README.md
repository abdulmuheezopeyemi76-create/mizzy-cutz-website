# MIZZY CUTZ — production website starter

This is a deployable website project, not a hosted/live website. It uses Supabase for
real shared bookings, owner sign-in, and gallery storage. You must connect your own
Supabase project and hosting account before it can go live.

## Included
- Public home page, service list, prices, gallery and booking form
- Owner sign-in and dashboard
- Shared bookings stored in Supabase
- Database-level unique active time-slot index to prevent double-booking; cancelled slots can be booked again
- Owner can confirm/cancel bookings, change service prices, and upload/delete gallery photos
- Customer receives an on-screen booking confirmation after the database accepts it

## Business details already entered
- MIZZY CUTZ — Owned by Abdulmuheez
- OYSCATECH
- 09029061551
- Open daily: 9:00 AM–9:00 PM
- Haircut ₦2,000; Haircut + Dye ₦3,000; Shape-up ₦1,000
- Other services are marked "Price on request" until you set prices.

## Setup (adult account holder may need to help with account/payment)
1. Create a Supabase project at https://supabase.com and keep its URL and anon key.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Supabase Authentication, create the owner's sign-in account.
4. In SQL Editor, replace `OWNER_EMAIL_HERE` in this statement with the exact sign-in email and run:
   `insert into public.admin_users(email) values ('OWNER_EMAIL_HERE');`
5. In Supabase Storage, the `gallery` bucket is created by the SQL script. The policies restrict uploads/deletes to admin users.
6. Copy `.env.example` to `.env` and fill in the Supabase URL and anon key.
7. Install Node.js, then run:
   `npm install`
   `npm run dev`
   Open the local address shown in the terminal to test.
8. Deploy the project to a hosting provider that supports Vite static sites. Add the same environment variables in the host's project settings.
9. Register `mizzycutz.com` only after checking availability, then point its DNS to your host.

## Important
- The domain is not registered by this project.
- No login password, Supabase account, hosting account, or domain purchase is created here.
- Never publish your Supabase service-role key in the website. The browser only uses the anon key.
- Use a strong, unique owner password and enable two-factor authentication where available.
- The initial hours are 9 AM–9 PM every day. Update `opening_hours` in `src/main.js` and the SQL function if your schedule changes.
- Bookings are automatically confirmed in the database when the slot is available. The unique constraint blocks two customers from taking the same date/time.
