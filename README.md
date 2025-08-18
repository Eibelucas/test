# Classroom Money Organizer

This is a web application for teachers to manage virtual money for their students.

## Prerequisites

- Node.js and npm (or yarn)
- A running MongoDB instance

## Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Make sure your MongoDB server is running. The application will try to connect to `mongodb://localhost:27017/classroom-money`. You can change this URI in `backend/index.js`.
4.  Start the backend server:
    ```bash
    node index.js
    ```
    The server will be running on `http://localhost:3000`.

## Frontend Setup

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
    The application will open in your browser at `http://localhost:3001` (or the next available port).

## Creating a Teacher Account

Teacher accounts can only be created via a command-line script.

1.  From the `backend` directory, run the following command, replacing `<username>` and `<password>` with your desired credentials:
    ```bash
    node createTeacher.js <username> <password>
    ```

## Usage

1.  Once both servers are running, open the application in your browser.
2.  Log in with the teacher account you created.
3.  Students can register for an account, but they will need to be approved by the teacher on the teacher's dashboard before they can log in.
