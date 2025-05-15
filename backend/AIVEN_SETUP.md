# Setting up Aiven MySQL for KIIT Washing Machine App

This guide will help you set up your Aiven MySQL database and connect it to your application.

## Step 1: Create an Aiven Account

1. Go to [Aiven.io](https://aiven.io/) and sign up for an account
2. Verify your email address

## Step 2: Create a MySQL Service

1. Log in to your Aiven console
2. Click "Create service"
3. Select "MySQL" as the service type
4. Choose a cloud provider (e.g., AWS, Google Cloud, Azure)
5. Select a region close to your application deployment (e.g., Mumbai for India)
6. Choose the free tier plan or a plan that fits your needs
7. Name your service (e.g., "kiit-washing-machine-mysql")
8. Click "Create service"

## Step 3: Get Connection Details

1. Wait for your service to be ready (status: "Running")
2. Click on your service name to view details
3. Go to the "Overview" tab
4. Note the following information:
   - Host: `<your-service-name>-<your-account>.aivencloud.com`
   - Port: Usually `3306` (default MySQL port)
   - User: Default is `avnadmin`
   - Password: Find this in the service details
   - Database name: Default is `defaultdb`

## Step 4: Configure Your Application

1. Create a `.env` file in your backend directory using the template below:
```
# Database Configuration for Aiven MySQL
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=3306
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=defaultdb
DB_SSL=true

# JWT Secret for Authentication
JWT_SECRET=your-jwt-secret

# API Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (if needed)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

2. Replace the placeholders with your actual Aiven MySQL credentials

## Step 5: Initialize Your Database

Run the database initialization script to create tables and initial data:

```
cd washing-machine-app/backend
npm run init-db
```

## Step 6: Test Your Connection

Start your backend server to test the connection:

```
npm run dev
```

You should see "Database connected to Aiven MySQL ✅" in the console output.

## Troubleshooting

If you encounter connection issues:

1. **Connection refused**: Check your host and port
2. **Access denied**: Verify your username and password
3. **SSL issues**: Make sure DB_SSL is set to "true"
4. **Unknown database**: Verify your database name exists

## Database Management

You can manage your database directly from the Aiven console:

1. Go to your service in the Aiven console
2. Click on the "Databases" tab to create/manage databases
3. Click on the "Users" tab to create/manage users
4. Click on the "Connection information" tab for connection details

## Need Help?

If you need further assistance, check out [Aiven's documentation](https://docs.aiven.io/docs/products/mysql) or contact their support. 