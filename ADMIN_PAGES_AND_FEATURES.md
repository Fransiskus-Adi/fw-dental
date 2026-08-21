# Admin Portal - Pages and Features Scan

This document provides a scan of all routes, pages, and features implemented in the FW Dental Admin Portal. It outlines the specific permissions required to access each page and execute operations within those pages.

---

## 1. Authentication & System Pages

### Login Page (`/admin/login`)
- **Purpose**: Portal access gateway.
- **Features**:
  - Secure credential login.
  - Forgot password request (OTP generation).
  - OTP verification and authentication status setup.
- **Permission**: Open access (no auth required).

---

## 2. Main Dashboard & Booking Pages

### Dashboard Home (`/admin`)
- **Purpose**: General overview of clinic metrics and upcoming bookings.
- **Features**:
  - **Metrics Dashboard**: View total balance, customer numbers, order volume, and earnings growth indicators.
  - **Appointments List**: View real-time upcoming booking queue (patient, doctor, slot, status).
- **Required Permission**: `page_dashboard` (Page Access)
  - *Feature Access*: `feat_dashboard_metrics` (View stats and balance details)

### Bookings Page (`/admin/bookings`)
- **Purpose**: Manage patient appointments and booking queues.
- **Features**:
  - **Search & Filter**: Find bookings by patient name, doctor, or status (Pending, Confirmed, Completed, Cancelled).
  - **Add Booking**: Book new appointments (Patient name, phone, doctor, treatment date, timeslot).
  - **Status Updates**: Confirm pending bookings, complete finished bookings, or cancel appointments.
- **Required Permission**: `page_bookings` (Page Access)
  - *Feature Access*: `feat_bookings_create` (Register new booking)
  - *Feature Access*: `feat_bookings_status` (Approve, complete, or cancel appointments)

---

## 3. Master Data Module

### Employees Page (`/admin/master-data/employees`)
- **Purpose**: Manage clinic administrative and staff accounts.
- **Features**:
  - **Search**: Filter staff list by name or email.
  - **Create Employee**: Add staff profile with email and mandatory login password.
  - **Edit Employee**: Modify full name, phone number, email, or reset/update passwords.
  - **Delete Employee**: Permanently remove staff accounts.
- **Required Permission**: `page_employees` (Page Access)
  - *Feature Access*: `feat_employees_write` (Create and update employees)
  - *Feature Access*: `feat_employees_delete` (Delete employees)

### Doctors Page (`/admin/master-data/doctors`)
- **Purpose**: Manage clinic dentists and their shift schedules.
- **Features**:
  - **Search**: Filter dentist profiles by name or specialization.
  - **Register Doctor**: Add doctors with specialization, shift start/end hours, email, and phone.
  - **Edit Doctor**: Modify contact details, specializations, or shift times.
  - **Status Switch**: Toggle status between "Active" and "On Leave".
  - **Delete Doctor**: Remove doctor profile.
- **Required Permission**: `page_doctors` (Page Access)
  - *Feature Access*: `feat_doctors_write` (Create, edit, and toggle status)
  - *Feature Access*: `feat_doctors_delete` (Delete doctors)

### Roles Page (`/admin/master-data/roles`)
- **Purpose**: Configure access rights and authorization permissions.
- **Features**:
  - **Search**: Filter roles by name or role code.
  - **Create Role**: Add role with capitalized code key, display name, description, and status.
  - **Edit Role**: Modify display name, description, enabled/disabled status, and configure granular permissions.
  - **Soft Delete**: Remove roles from active lookup (retains historical data).
- **Required Permission**: `page_roles` (Page Access)
  - *Feature Access*: `feat_roles_write` (Create and edit roles)
  - *Feature Access*: `feat_roles_delete` (Delete roles)

---

## 4. Scheduling & General Settings

### Schedules Page (`/admin/schedules`)
- **Purpose**: Visual shift calendar and appointment booking timelines.
- **Features**:
  - **Dentist Filtering**: View individual dentist timetables or a consolidated calendar.
  - **Weekly Shift Grid**: Hourly slot cards showing patients and treatments from Monday to Friday (8 AM - 5 PM).
- **Required Permission**: `page_schedules` (Page Access)

### Settings Page (`/admin/settings`)
- **Purpose**: Customize clinic operational parameters.
- **Features**:
  - **Clinic Profile**: Edit name, phone, email, and location.
  - **Appointment Rules**: Toggles for auto-confirming bookings, online payment, and notification systems (Email / WhatsApp).
  - **System Preferences**: Configure appointment slot durations and daily booking capacities.
- **Required Permission**: `page_settings` (Page Access)
  - *Feature Access*: `feat_settings_write` (Update profile, rules, and preferences)

---

## Granular Permission Definition Matrix

The following toggle-based permission keys are mapped on the role creation/edit dialog:

| Permission Key | Type | Description |
| :--- | :--- | :--- |
| **`page_dashboard`** | Page Access | Can open and view the home dashboard overview page. |
| **`feat_dashboard_metrics`** | Feature | Can view financial balances and earnings metrics widgets. |
| **`page_bookings`** | Page Access | Can open and search the Bookings queue. |
| **`feat_bookings_create`** | Feature | Can create new patient appointments. |
| **`feat_bookings_status`** | Feature | Can confirm, cancel, or complete patient bookings. |
| **`page_schedules`** | Page Access | Can view the schedules and timetables grid. |
| **`page_employees`** | Page Access | Can view the Employee Master Data section. |
| **`feat_employees_write`** | Feature | Can add new employees and edit details (including passwords). |
| **`feat_employees_delete`** | Feature | Can delete employees. |
| **`page_doctors`** | Page Access | Can view the Doctor Master Data section. |
| **`feat_doctors_write`** | Feature | Can register dentists, edit profiles, and toggle active status. |
| **`feat_doctors_delete`** | Feature | Can delete dentist records. |
| **`page_roles`** | Page Access | Can view the Roles Master Data section. |
| **`feat_roles_write`** | Feature | Can create, edit roles, and toggle their system status. |
| **`feat_roles_delete`** | Feature | Can delete roles. |
| **`page_settings`** | Page Access | Can view the Settings page. |
| **`feat_settings_write`** | Feature | Can save modifications to clinic profile, rules, or system preferences. |
