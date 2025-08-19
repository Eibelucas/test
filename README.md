# Classroom Money Organizer

This is a web application for teachers to manage virtual money for their students.

## Quick Start for Windows

For an easy setup on Windows, simply double-click the `start.bat` file in the root of the project.

This script will automatically:
1. Install all dependencies for the backend and frontend.
2. Start both the backend and frontend servers in new command prompt windows.

After running the script, a browser window should open with the application.

## Manual Setup

If you are not on Windows or prefer to run the application manually, follow the steps below.

### Prerequisites

- Node.js and npm (or yarn)

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the backend server:
    ```bash
    node index.js
    ```
    The server will be running on `http://localhost:3000`. The database files will be created automatically in the `backend/data` directory.

### Frontend Setup

1.  In a new terminal, navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm start
    ```
    The application will open in your browser at `http://localhost:3001`.

### Default Admin Account

The first time you start the backend server, a default teacher account will be created automatically with the following credentials:
- **Username:** `Admin`
- **Password:** `Lucaluc0`

You can use this account to log in and start using the application.

### Creating Additional Teacher Accounts

If you need to create more teacher accounts, you can use the command-line script.

1.  From the `backend` directory, run the following command, replacing `<username>` and `<password>` with your desired credentials:
    ```bash
    node createTeacher.js <username> <password>
    ```

### Usage

1.  Once both servers are running, open the application in your browser.
2.  Log in with the default `Admin` account or another teacher account you created.
3.  Students can register for an account, but they will need to be approved by a teacher on the teacher's dashboard before they can log in.
