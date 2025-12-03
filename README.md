# Business Management System

A comprehensive, generic business management system built with Next.js 14, TypeScript, and Supabase. This system provides complete admin functionality for managing products, orders, customers, support tickets, and business analytics.

## 🎯 Features

### Core Business Management
- **Product Management**: Complete CRUD operations with inventory tracking
- **Order Processing**: Full order lifecycle management with status updates
- **Customer Management**: Customer profiles, analytics, and communication
- **Support System**: Professional ticket management with real-time messaging
- **Analytics Dashboard**: Real-time KPIs, metrics, and performance analytics
- **Admin User Management**: Multi-admin system with role-based access control
- **System Configuration**: System settings, health monitoring, and maintenance tools
- **User Profile Management**: Complete user profile pages with preferences and order history

### Technical Features
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Supabase** for backend and database (local development supported)
- **Tailwind CSS** for styling
- **Multiple Themes**: Light, Dark, Blue, Green, and Red color themes
- **Responsive Design** for mobile and desktop
- **Role-Based Access Control** (RBAC)
- **Real-time Updates** and notifications

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** or **yarn**
- **Docker** or **Podman** (for local Supabase)
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Stefan-migo/businessManagementApp.git
cd businessManagementApp/BusinessManagementApp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Local Supabase Database

This project uses **local Supabase** for development. Follow these steps:

#### Start Local Supabase

```bash
npm run supabase:start
```

**First time setup:**
- Downloads ~800MB of Docker images
- Takes 5-10 minutes
- Subsequent starts take 10-30 seconds

#### Get Database Credentials

```bash
npm run supabase:status
```

This will display:
- API URL (usually `http://127.0.0.1:54321`)
- Anon Key (public key)
- Service Role Key (private key)
- Database URL
- Studio URL (usually `http://127.0.0.1:54323`)

#### Configure Environment Variables

Create a `.env.local` file in the `BusinessManagementApp` directory:

```bash
cp env.example .env.local
```

Update `.env.local` with the values from `supabase:status`:

```env
# Supabase Configuration (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key_from_status>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key_from_status>

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### Apply Database Migrations

```bash
npm run supabase:reset
```

This will:
- Create all database tables
- Set up Row Level Security (RLS) policies
- Create necessary functions and triggers
- Seed initial data (if any)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Main App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **Supabase Studio**: http://127.0.0.1:54323 (Database UI)
- **Email Testing (Mailpit)**: http://127.0.0.1:54324

## 👤 Creating Your First Admin User

After setting up the database, you need to create an admin user to access the admin panel.

### Method 1: Using SQL Script (Recommended)

1. **Sign up a regular user** through the signup page at http://localhost:3000/signup

2. **Grant admin access** using the SQL script:

```bash
cd BusinessManagementApp
podman exec -i supabase_db_web psql -U postgres -d postgres < grant-admin-access.sql
```

Edit `grant-admin-access.sql` and change the email to your user's email before running.

### Method 2: Using Supabase Studio

1. Open Supabase Studio: http://127.0.0.1:54323
2. Go to **SQL Editor**
3. Run this SQL (replace `your-email@example.com` with your email):

```sql
DO $$
DECLARE
  user_id uuid;
  user_email text := 'your-email@example.com';
BEGIN
  -- Find user by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;

  -- Update profile membership_tier to 'admin'
  UPDATE public.profiles
  SET membership_tier = 'admin', updated_at = now()
  WHERE id = user_id;

  -- Add to admin_users table
  INSERT INTO public.admin_users (id, email, role, is_active, created_at, updated_at)
  VALUES (user_id, user_email, 'admin', true, now(), now())
  ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Admin access granted to %', user_email;
END $$;
```

4. Log in at http://localhost:3000/login with your email and password
5. You'll be redirected to the admin panel

## 📁 Project Structure

```
BusinessManagementApp/
├── src/
│   ├── app/
│   │   ├── admin/              # Admin pages
│   │   │   ├── page.tsx        # Dashboard
│   │   │   ├── products/       # Product management
│   │   │   ├── orders/         # Order management
│   │   │   ├── customers/      # Customer management
│   │   │   ├── support/        # Support ticket system
│   │   │   ├── analytics/      # Analytics dashboard
│   │   │   ├── admin-users/    # Admin user management
│   │   │   └── system/         # System configuration
│   │   ├── profile/            # User profile page
│   │   ├── login/              # Login page
│   │   ├── signup/             # Signup page
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── admin/              # Admin-specific components
│   │   ├── ui/                 # Reusable UI components
│   │   └── layout/             # Layout components
│   ├── contexts/               # React contexts (Auth, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── types/                  # TypeScript type definitions
│   └── utils/                  # Utility functions
├── supabase/
│   ├── migrations/             # Database migrations
│   └── config.toml             # Supabase configuration
└── public/                     # Static assets
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Supabase Commands
npm run supabase:start   # Start local Supabase
npm run supabase:stop    # Stop local Supabase
npm run supabase:status  # Check status and get credentials
npm run supabase:reset   # Reset database (reapply migrations)
```

## 🎨 Themes

The application supports multiple color themes:
- **Light** - Clean white theme (default)
- **Dark** - Dark theme with light text
- **Blue** - Professional blue palette
- **Green** - Natural green palette
- **Red** - Bold red palette

Switch themes using the palette icon in the admin header.

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles
- `admin_users` - Admin user accounts
- `admin_activity_log` - Admin activity audit trail
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order management
- `order_items` - Order line items
- `support_tickets` - Support ticket system
- `support_messages` - Ticket messages

### Key Functions
- `is_admin(user_id)` - Check admin privileges
- `get_admin_role(user_id)` - Get admin role
- `log_admin_activity()` - Log admin actions

## 🔐 Authentication & Authorization

The system uses Supabase Auth with role-based access control:

- **Regular Users**: Can access their profile and place orders
- **Admin Users**: Full access to admin panel (products, orders, customers, analytics, etc.)

Admin status is determined by the `admin_users` table. Users must be added to this table to gain admin access.

## 🌐 Access Points

- **Main App**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin (requires admin access)
- **User Profile**: http://localhost:3000/profile (requires authentication)
- **Supabase Studio**: http://127.0.0.1:54323 (Database management UI)
- **Email Testing**: http://127.0.0.1:54324 (Mailpit - view test emails)

## 🐛 Troubleshooting

### Supabase Won't Start

```bash
# Check if containers are running
podman ps

# Stop and restart
npm run supabase:stop
npm run supabase:start
```

### Port Conflicts

If ports 54321-54324 are already in use, you can change them in `supabase/config.toml`:

```toml
[api]
port = 54321  # Change if needed

[db]
port = 54322  # Change if needed

[studio]
port = 54323  # Change if needed
```

### Migration Errors

```bash
# Reset the database completely
npm run supabase:reset
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Try building again
npm run build
```

### Can't Access Admin Panel

1. Verify you're logged in
2. Check if your user exists in `admin_users` table:
   ```sql
   SELECT * FROM admin_users WHERE email = 'your-email@example.com';
   ```
3. Verify admin status:
   ```sql
   SELECT is_admin('your-user-id'::uuid);
   ```

## 📝 Environment Variables

Required environment variables (`.env.local`):

```env
# Supabase (Local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from_supabase_status>
SUPABASE_SERVICE_ROLE_KEY=<from_supabase_status>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

Optional (for production features):
- `RESEND_API_KEY` - For email sending
- `MERCADOPAGO_ACCESS_TOKEN` - For payment processing
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` - For payment processing

## 📚 Documentation

- [Local Setup Guide](../SETUP_LOCAL.md) - Detailed local development setup
- [Admin User Creation](../CREATE_ADMIN_USER.md) - How to create admin users
- [Database Migrations](./supabase/migrations/) - Database schema migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions:
- Check the troubleshooting section above
- Review the documentation files
- Open an issue on GitHub: https://github.com/Stefan-migo/businessManagementApp/issues

---

**Note**: This project uses **local Supabase** for development. For production deployment, you'll need to set up a Supabase cloud project and update the environment variables accordingly.
