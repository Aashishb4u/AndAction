AndAction Rebuild — Functional Specification & UX Flow
Purpose & Scope
We will fully rebuild andaction.in with a clean, scalable architecture, a frictionless UX for both Customers (people who want to book artistes) and Artisans/Artists (creators/performers), and an operationally efficient Admin backend. This document enumerates all current and planned flows, page-by-page functional specs, step-by-step journeys, data contracts, and edge cases — so design, engineering, QA, and ops teams can move in lockstep.

1. Personas & Roles
1.1 Visitors (Unauthenticated Users)
Browse home, categories, search results, artistes, and video detail pages.


Can view short videos.


Can read About, FAQs, Terms, Privacy, Suggestions.


Can attempt to favourite / book, but will be prompted to login/register.


1.2 Customers (Authenticated Users)
Everything a visitor can do, plus:


Contact artistes (message/call CTA as per platform policy).


Profile management.


1.3 Artisans / Artists (Authenticated, Onboarded)
Complete multi-step onboarding: personal details, profession, languages, charges, bio, media, availability.


Connect YouTube & Instagram to import videos/reels (select, delete).


Manage profile, portfolio (videos/photos).


Manage bookings: Track customer info & venue.

2. Global Information Architecture
Header / Navigation (Logged-out):
Logo (link to Home)


Search (toggle / expand on click)


Menu / Hamburger (opens off-canvas nav for mobile):


Home


Categories (expandable mega-menu)


Login / Register (Customer)


Artisan Login / Register


About


FAQs


Terms


Privacy


Suggestions


Header / Navigation (Logged-in Customer):
Logo


Search


Menu: Home, Categories, My Bookings, Suggestions, FAQs, About, Terms, Privacy


Profile avatar dropdown: Account Settings, Logout


Header / Navigation (Logged-in Artisan):
Logo


Search


Menu: Dashboard, My Profile, Media Library, Bookings, Settings


Profile avatar dropdown: Account Settings, Logout


Footer (global):
About, FAQs, Terms, Privacy, Suggestions


Contact / Support


Social links


Copyright

3. Key User Journeys (Step-by-step)
3.1 Visitor → Discover → Video Detail → Login 
Visitor lands on Home.


Scrolls through category-wise artist/video listings (e.g., Live Band for Ring Ceremony, Magician for Kids' Birthday).


Clicks on a video card → lands on Video Detail.


Completes authentication → redirected back to the same page.



3.3 Artisan → Signup → Connect YouTube/Instagram → Import Videos → Publish Profile
Artisan selects Artisan Login/Register from header.


Selects login with google/facebook.


Lands on Onboarding Wizard (multi-step):


Step 1: Personal & Contact Details


Step 2: Profession details (categories, subcategories, services)


Step 3: Languages


Step 4: Charges / Packages (Base rate, hourly, outstation extra, etc.)


Step 5: Bio


Step 6: Connect YouTube and Instagram → permission capture


Step 7: Video Import screen → select which to import, delete unwanted ones


Step 9: Preview & Submit for Review


Profile goes Live → public can view & book.


3.4 Artisan → Manage Booking → Add Venue & Customer Info → Track
Tracking bookings with perfect calendar view, customer info and event detail.


3.5 Short Videos → Share → Viral Growth
User opens Short Videos feed (Reels style).


Each short video has Share (copy link / WhatsApp / Instagram).



4. Page-by-Page Functional Specification
4.1 Home Page
Hero section: video background, heading, paragraph, CTA buttons (e.g., “Find an Artist”, “Sign up as an Artisan”).


Search bar (prominently placed) with suggestions & trending queries.


Category-wise artist/video listings (card carousels):


e.g., “Live Band for Ring Ceremony”, “Magician for Kids' Birthday”.


Each carousel allows horizontal scroll, “View All” CTA to category page.


Trending Short Videos block.


How It Works (3-4 steps graphic for customers & artisans).


Footer links.


4.2 Category / Collection Pages
Grid/List of artists/videos for the selected category.


Pagination or infinite scroll.


4.3 Search Results
Search query persisted in field; option to refine.


Results segmented by Video.


4.4 Video Detail Page
Video player (YouTube embed).


Title, description, tags, duration.


Share (link, WhatsApp, social platforms).


Artisan Profile button (CTA to full artist page/profile).


Related Videos panel (same category / artisan / tags).


Report button (abuse/infringement).


4.5 Short Video Detail / Feed
Vertical feed (auto-play, swipe up/down).


Link to Artisan Profile & full-length videos.



4.6 Artisan Profile Page
Header: Cover photo/video, profile picture, name, location.


Primary CTAs: Book Now, Contact (phone/email/whatsapp), Share.


About: bio, profession, languages, travel policy, charges summary.


Media Tabs: Videos, Short Videos.



4.9 Artisan Dashboard
Overview: Bookings tracking.


My Profile: edit all profile data with validation.


Media Library: videos from YouTube/Instagram + uploaded photos & clips.


Bulk select, delete.


Sync button to re-fetch from channels.


4.10 Authentication & Account Management
Google/Facebook


Profile settings for both roles.


GDPR/DPDP: data deletion request flow.


4.11 Static & Support Pages
About, FAQs, Terms, Privacy, Suggestions (feedback form with file upload optional), Contact Us.



5. Feature Catalogue (Checklist)
5.1 Core Discovery


5.2 Engagement


5.3 Bookings Tracker


5.4 Artisan Enablement

5.5 Platform & Compliance

6. Integrations
YouTube Data API: fetch channel videos, thumbnails, metadata. Store source IDs & refresh tokens.


Instagram Graph API / Basic Display API: import reels/videos with permissions.



7. Tech Stack (Proposed — to be validated)
Front-end: HTML, CSS, TailwindCSS.


Back-end: Laravel, Livewire (Tall Stack).


DB: MySQL
