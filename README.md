HKMU Lost & Found System (Group 17)

[Project Status]Finished
[Course]IT1030SEF

We used standard front-end technologies including HTML, CSS, and JavaScript to create a system that replaces traditional physical notice boards. 
The application allows students to report lost items and browse existing records in real time. 
Administrators have the ability to manage and delete listings. Since this is a front-end prototype, we used browser localStorage and Base64 image encoding to store data on the client side without needing a backend server.

[Live Demo: Try it here!]https://james-luo666.github.io/IT1030SEF-lost-found-Group17/

---
Key Features

1. Role-Based Access Control (RBAC)
Student Mode: Students can register with their HKMU Student ID (e.g., s1234567), report lost items, upload images, and manage their own submissions.
Admin Mode: Administrators can search globally, verify items, and delete invalid reports. Default login: `admin001`.

2. Complete CRUD & State Machine
Instead of permanently deleting an item when it is found, the system implements a logical state flow:
Pending (Orange):The item is currently lost and waiting to be found.
Resolved (Green):The original reporter or an admin marks the item as "Found".
Edit:Users can retrieve and update their previously submitted item details seamlessly.

3. Serverless Data Persistence
LocalStorage Integration: All user accounts and lost item data are securely stored in the browser's `localStorage`, allowing the system to retain data even after page refreshes.
Base64 Image Encoding: Utilizes the HTML5 `FileReader` API to convert user-uploaded images into Base64 Data URLs, solving the challenge of storing binary files in local text storage.

4. Data Portability (JSON Import/Export)
To overcome the device-specific limitation of `localStorage`, the system features built-in data migration:
Export: Download all current data (users, items, images) as a `.json` backup file.
Import: Upload a `.json` file to instantly restore or transfer the system state to a different device.

---

Technology Stack

Structure: HTML5
Styling: CSS3 (Vanilla CSS, Flexbox layout, custom keyframe animations, responsive design)
Logic: Vanilla JavaScript (Event-driven DOM manipulation, SPA routing via CSS class toggling)
Storage: Web Storage API (`localStorage`)

---

How to Run Locally

Since this is a 100% frontend application, no server setup or database configuration is required!

1. Clone this repository:
   ```bash
   git clone [https://github.com/YourUsername/hkmu-lost-found.git](https://github.com/YourUsername/hkmu-lost-found.git)
2. Open the project folder.
3. Simply double-click index.html to open it in any modern web browser (Chrome, Edge, Safari).
