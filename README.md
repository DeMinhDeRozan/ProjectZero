HEALTH COVER SIMULATOR


A full-stack CRUD web application simulating a private health insurance quote system. User can create, read, update and delete quote records. Each quote is calculated from cover type, hospital/extra tiers, applicant ages, Lifetime Health Cover loading, family upgrade fee and annual-payment discount.


Tech Stack 


Frontend: React (Vite)


Backend: Node.js + Express


Database: SQLite


Styling: Plain CSS


Requirements


Node.js v24 or higher -> the Node's built-in node:sqlite module (DatabaseSync) is only available from Node.js v22 and works well from v24.


Linux-based OS should be used to test this project, not sure other OS will be compatible


Installation and Running


1. Open the terminal and clone my repo using "git clone https://github.com/DeMinhDeRozan/ProjectZero.git"

   
3. Head to the cloned repo, which is ProjectZero using "cd ProjectZero"

   
5. Install dependencies defined in package.json, using "npm install"

   
7. Once finished, type "node server.js"


   -> This activates the Express API (backend) to run on http://localhost:3001


8. Open another terminal, make sure you are still in the folder ProjectZero, then type "npm run dev"


   -> This allows the Vite dev server (front-end) to run on http://127.0.0.1:5173


Database Setup


The database is SQLite, created automatically on server start via server.js.


On first run, server.js opens (or creates) hcs.db in the project root using node:sqlite.


I already attach the database script into the backend file, so no manual setup step is required — simply running npm run dev or npm run start initialises the schema.


The schema is in the init.sql


The table includes constraints (CHECK) to enforce valid cover types, cover history values, age range (18–100), and discount range (0–10), providing an extra layer of database-level validation.
