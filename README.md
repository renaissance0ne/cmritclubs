# 🎓 CMRIT Clubs

![CMR Logo](https://raw.githubusercontent.com/renaissance0ne/cmritclubs/refs/heads/main/cmritclubs/public/logo_small.png)

# 📑 College Clubs Permission Platform 

A modern web platform to streamline the process of club permission letter approvals in colleges, eliminating the hassle of manual paperwork and in-person faculty visits.

Live site: [cmritclubs.vercel.app](https://cmritclubs.vercel.app/)

## 🧭 Table of Contents

- [🧾 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ Platform Architecture](#-platform-architecture)
- [👥 User Roles & Workflows](#-user-roles--workflows)
  - [🧑‍💼 Club Leader Onboarding](#-club-leader-onboarding)
  - [🏛️ College Official Onboarding](#-college-official-onboarding)
  - [✉️ Letter of Permission Process](#-letter-of-permission-process)
- [🔒 Security Features](#-security-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [💡 Why This Approach?](#-why-this-approach)
- [🔮 Future Enhancements](#-future-enhancements)
- [📝 Contributing](#-contributing)
- [📄 License](#-license)

## 🧾 Overview

This platform is designed for college clubs to request and receive permission letters digitally. It enables club leaders to draft letters online, submit them for approval, and allows college officials to review and approve/reject requests from anywhere, at any time.

## ✨ Key Features

- **Digital Letter Drafting:** Club leaders can draft and submit permission letters online.
- **Automated Verification:** Streamlined club leader verification and onboarding.
- **Role-based Dashboards:** Separate dashboards for club leaders and college officials.
- **Secure File Uploads:** Upload and manage proof documents securely.
- **Automated Notifications:** Email alerts for status updates and actions.
- **PDF Generation:** Approved letters are generated as secure, tamper-resistant PDFs.
- **Centralized Management:** All data and user management in one place.

## 🏗️ Platform Architecture

| Layer            | Technology                       | Purpose                                           |
|------------------|----------------------------------|---------------------------------------------------|
| Frontend         | Next.js (React)                  | Fast, modern, server-rendered UI                  |
| Backend          | Next.js API Routes               | Serverless logic, API endpoints                   |
| Authentication   | Firebase Authentication          | Secure login, registration, email verification    |
| Database         | Firebase DB                      | Application data (users, clubs, letters, etc.)    |
| File Storage     | Uploadthing                      | Store uploaded files (proof documents)            |

## 👥 User Roles & Workflows

### 🧑‍💼 Club Leader Onboarding

1. **Sign Up:**
   - Register using official college email via Firebase Authentication.
   - Email verification is required.

2. **Application Submission:**
   - Complete an application form with personal and club details.
   - Upload a "Letter of Proof" (e.g., club authorization letter or related document).

3. **Verification:**
   - Application is reviewed by college officials.
   - Status is updated to `approved` or `rejected` in the system.
   - Club leaders receive notification emails.

4. **Platform Access:**
   - Approved club leaders gain full access to draft and submit permission letters.

### 🏛️ College Official Onboarding

- Accounts are created manually by the platform admin for 10-15 officials.
- Officials can log in using their college email.
- No self-registration required for officials.
- Officials access a dashboard to:
  - Review club leader applications.
  - Approve or reject permission letter requests.

### ✉️ Letter of Permission Process

1. **Drafting:** Club leaders fill out a structured form for each event/request.
2. **Submission:** Letters are saved in the database with status `pending`.
3. **Review:** College officials receive notifications and review requests.
4. **Action:** Officials can approve, reject, or comment on each letter.
5. **Notification:** Club leaders are notified of the decision.
6. **PDF Generation:** Once all required approvals are received, a secure PDF is generated.

## 🔒 Security Features

- **Authentication:** All users must verify their identity via college email.
- **Role-Based Access:** Only authorized users can access sensitive actions.
- **Secure File Storage:** Proof documents are stored in uploadthing.
- **PDF Security:** Generated permission letters include:
  - Flattened content (non-editable)
  - Watermark
  - Unique hash
  - QR code for authenticity verification
  - Strict read-only permissions

## 🛠️ Tech Stack

- **Frontend:** Next.js (React)
- **Backend:** Next.js API Routes
- **Authentication:** Firebase Authentication
- **Database:** Firebase DB
- **File Storage:** Uploadthing
- **PDF Generation:** (e.g., pdf-lib, qPDF, or server-side library)
- **Notifications:** Firebase Email/SMTP

## 🚀 Getting Started

1. **Clone the Repository**
2. **Set Up Environment Variables**
   - Firebase project credentials
   - Firebase URI
   - Uploadthing token
3. **Install Dependencies**
   ```bash
   npm install
   ```
4. **Run the Development Server**
   ```bash
   npm run dev
   ```
5. **Access the Platform**
   - Club leaders: Register and apply for verification.
   - College officials: Log in with provided credentials.

## 💡 Why This Approach?

- **Enhanced Security:** Managed authentication and secure file storage.
- **Scalability:** Automated onboarding and notifications.
- **User Experience:** Streamlined workflows for both clubs and officials.
- **Centralized Management:** All data and permissions in one place.
- **Leverages Google Ecosystem:** Seamless integration with Firebase Auth and DB.

## 🔮 Future Enhancements

- Mobile app support
- Advanced notification preferences
- Customizable approval workflows

📝 Contributing

Fork the repository
Create a feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request

---

**Version**: 1.0.0  
**Last Updated**: July 2025  
**Maintained by**: Vallabh Dasari

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
