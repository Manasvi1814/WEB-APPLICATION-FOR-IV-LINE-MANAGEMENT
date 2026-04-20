Web Application for IV Line Management– README

What is this project?
The IV Monitoring System is a web application used to track intravenous (IV) therapy in hospitals.
It helps monitor insertions, detect complications, and generate reports.

Technologies Used
- Frontend: React + TypeScript
- Backend/Database: Supabase (PostgreSQL)
- Authentication: Custom (Department-based login)

How the system works
1. Users log in using department-based credentials
2. Nurses record IV insertions and patient details
3. Complications (phlebitis, extravasation) are tracked
4. Data is stored in PostgreSQL via Supabase
5. Reports are generated with key performance metrics

Key Features
- Department-based login
- IV insertion tracking
- Complication monitoring
- Role-based access (Nurse, Doctor, Admin)
- Automated reports and statistics

How to run the project
1. Clone the repository
   git clone https://github.com/Manasvi1814/WEB-APPLICATION-FOR-IV-LINE-MANAGEMENT)
   cd iv-monitoring-system

2. Install dependencies
   npm install

3. Setup environment variables (.env file)
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key

4. Start the application
   npm run dev

How to use the system
1. Login using department and user credentials
2. Add IV insertion details
3. Update patient condition
4. Record complications if any
5. View reports and analytics

Metrics Calculated
- Insertion Success Rate
- Phlebitis Rate
- Extravasation Rate

Summary
This system digitizes IV monitoring with department-based access, improving accuracy, tracking, and reporting in hospitals.
