# Digi Library

A hostel library management website. Hostel mates can search the whole book collection and see which books are available or when they are due back, while the library committee manages books, issues and returns from a protected admin dashboard.

**Live site:** [https://digi-library-one.vercel.app/](https://digi-library-one.vercel.app/)


Add screenshots after taking them (save them in docs/screenshots/), then remove this comment markers:

![Public catalog](docs\screenshots\catalog.png)
![Admin dashboard](docs\screenshots\admin-dashboard.png)
![Issue a book](docs\screenshots\issue-book.png)


## Why this project exists

The hostel library holds more than 1,100 books and is run by a student library committee. Students had to walk to the library to find out whether a book existed or was free, and the committee tracked borrowers by hand. Digi Library replaces that with a searchable website and a fast issue/return workflow, built around a real register of 1,172 books.

## Features

**Public (no login needed)**
- Search by title, author or book code, and filter by category
- Paginated catalog with a live result count
- Availability at a glance: available, borrowed (with due date), or not available
- Borrower names are never shown publicly, only the due date
- Works with Kannada titles (UTF-8 end to end)

**Admin dashboard (committee only)**
- Login with hashed passwords and a single active session at a time
- Add, edit and delete books, with server-side validation
- Issue and return books using database transactions
- Overdue list on the dashboard
- Search by title, author, code, borrower name or registration number
- Bulk CSV import with validation, all-or-nothing saving and safe re-uploads

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MySQL 8 using the `mysql2` driver and raw parameterized SQL |
| Auth | `bcryptjs` password hashing, `httpOnly` session cookie |
| CSV parsing | PapaParse |
| Hosting | Vercel (app) and Aiven free MySQL (database) |

## How it works

```
Browser
  |  GET /?q=habit&genre=Self-Help&page=2
  v
Next.js (Server Components render on the server)
  |  parameterized SQL through a connection pool
  v
MySQL
```

- **Reading:** server components query MySQL directly, so no database code reaches the browser.
- **Writing:** forms call Server Actions. Every action starts with `requireAdmin()`, validates the input, runs parameterized SQL, refreshes cached pages with `revalidatePath`, and redirects with a status message.
- **Issue and return:** run inside a transaction. The issue step uses a conditional update (`WHERE status = 'available'`) and checks `affectedRows`, so two admins can never issue the same book at the same moment.

## Database design

| Table | Purpose |
|---|---|
| `books` | One row per physical copy: `book_code` (unique), title, author, category, price, donated, remarks, status, due date |
| `loans` | One row per issue: book, borrower name and registration number, issue/due/return dates, and which admin issued it |
| `admins` | Committee accounts: username, bcrypt hash, active flag and the single allowed session id |

Book statuses: `available`, `borrowed`, `lost`, `unverified`. A loan with `return_date IS NULL` is still open. The full schema is in [`database/schema.sql`](database/schema.sql).

## Security notes

- Passwords are stored only as bcrypt hashes
- Session cookie is `httpOnly`, `sameSite=lax` and `secure` in production
- Only one admin session is valid at a time; a new login invalidates the old one
- All queries use `?` placeholders (no string-built SQL)
- Authorization is checked on the server in every action, not just by hiding buttons
- The same error message is shown for a wrong username and a wrong password
- Secrets live in environment variables and are never committed

## Project structure

```
app/
  page.tsx                      public catalog
  api/books/route.ts            JSON API for the catalog
  admin/                        dashboard, login, import, edit and issue pages
    actions.ts                  login and logout
    book-actions.ts             add, update, delete
    loan-actions.ts             issue and return (transactions)
    import-actions.ts           CSV import
components/                     Pager, DeleteButton
lib/                            db pool, queries, auth, date helpers
database/schema.sql             table definitions
scripts/create-admin.mjs        creates an admin account
```

## Run it locally

Requirements: Node.js 20.6 or newer and MySQL 8.

```bash
git clone https://github.com/Yogeshbn2008/digi-library.git
cd digi-library
npm install
```

1. Create the tables by running [`database/schema.sql`](database/schema.sql) in MySQL.
2. Create a `.env.local` file in the project root:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD="your-mysql-password"
DB_NAME=digilibrary
```

Quote the password if it contains `#`. Add `DB_SSL=true` only when connecting to a hosted database that requires TLS.

3. Create the first admin account:

```bash
node --env-file=.env.local scripts/create-admin.mjs
```

4. Start the app:

```bash
npm run dev
```

Open http://localhost:3000 and sign in at `/admin/login`.

## CSV import format

Upload a UTF-8 CSV from the admin dashboard with these columns:

```
book_code,title,author,category,price,donated,status,remarks
```

- Required: `book_code`, `title`, `category`
- `status` can be `available`, `lost` or `unverified`
- `donated` can be `0`/`1` or `yes`/`no`
- Rows whose `book_code` already exists are skipped, so uploading the same file twice is safe
- If any row is invalid, nothing is imported and the line numbers are reported

## Deployment

- **App:** Vercel, connected to this repository so every push to `main` redeploys. The function region is set close to the database.
- **Database:** Aiven free MySQL. The environment variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` and `DB_SSL=true` are set in the Vercel project settings.
- Free database tiers can power off after long inactivity, so open the site regularly or check the provider console if a database error appears.

## Roadmap

- [x] Public catalog with search, categories and pagination
- [x] Admin login with a single active session
- [x] Add, edit and delete books
- [x] Issue and return with transactions, overdue list
- [x] CSV import for the full register
- [x] Deployment
- [ ] Change a book's status and edit book codes in the admin forms
- [ ] Better layout on small phone screens
- [ ] CSV export for backups
- [ ] Loan history page and reports
- [ ] Change password and add/remove admins from the dashboard
- [ ] Student accounts, reservations and reminders

## Known limitations

- No student accounts yet: the catalog is public and the admin enters borrower details when issuing
- One physical copy per row, tracked by its book code
- Titles and authors are kept exactly as written in the original register, including its spelling mistakes

## Author

Built by Yogesh B N, B.Tech engineering student, as a real tool for the hostel library committee.