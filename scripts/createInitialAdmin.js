import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// User Schema (same as in your project)
const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, trim: true, lowercase: true, unique: true },
        email: { type: String, required: true, trim: true, lowercase: true, unique: true },
        password: { type: String, required: true, trim: true },
        orderIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        shippingId: { type: mongoose.Schema.Types.ObjectId, default: null },
        role: { 
            type: String, 
            enum: ['Administrator', 'Role A', 'Role B'], 
            default: 'Role B' 
        },
        assignedScope: { type: String, default: null },
        managedUsers: { type: [mongoose.Schema.Types.ObjectId], default: [] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date, default: null },
        isAdmin: { type: Boolean, default: false }
    },
    { versionKey: false, timestamps: true }
);

const User = mongoose.model('User', UserSchema);

// Create initial administrator
const createInitialAdmin = async () => {
    try {
        await connectDB();

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'Administrator' });
        if (existingAdmin) {
            console.log('Administrator already exists:', existingAdmin.username);
            return;
        }

        // Create admin password
        const adminPassword = 'Admin123!'; // Change this to a secure password
        const hashedPassword = await bcrypt.hash(adminPassword, 13);

        // Create administrator account
        const admin = new User({
            username: 'flower_admin',
            email: 'admin@flowerbuds.com',
            password: hashedPassword,
            role: 'Administrator',
            isAdmin: true,
            isActive: true
        });

        await admin.save();
        console.log('✅ Administrator account created successfully!');
        console.log('Username: flower_admin');
        console.log('Password: Admin123!');
        console.log('Email: admin@flowerbuds.com');

    } catch (error) {
        console.error('Error creating administrator:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Create sample users for each role
const createSampleUsers = async () => {
    try {
        await connectDB();

        const sampleUsers = [
            {
                username: 'manager1',
                email: 'manager1@flowerbuds.com',
                password: 'Manager123!',
                role: 'Role A',
                assignedScope: 'North Region'
            },
            {
                username: 'manager2',
                email: 'manager2@flowerbuds.com',
                password: 'Manager123!',
                role: 'Role A',
                assignedScope: 'South Region'
            },
            {
                username: 'customer1',
                email: 'customer1@gmail.com',
                password: 'Customer123!',
                role: 'Role B'
            },
            {
                username: 'customer2',
                email: 'customer2@gmail.com',
                password: 'Customer123!',
                role: 'Role B'
            }
        ];

        for (const userData of sampleUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ username: userData.username });
            if (existingUser) {
                console.log(`User ${userData.username} already exists`);
                continue;
            }

            const hashedPassword = await bcrypt.hash(userData.password, 13);
            const user = new User({
                ...userData,
                password: hashedPassword,
                isActive: true
            });

            await user.save();
            console.log(`✅ Created ${userData.role} account: ${userData.username}`);
        }

        console.log('\n📋 Sample Accounts Created:');
        console.log('Administrator: flower_admin / Admin123!');
        console.log('Role A (Manager): manager1 / Manager123!');
        console.log('Role A (Manager): manager2 / Manager123!');
        console.log('Role B (Customer): customer1 / Customer123!');
        console.log('Role B (Customer): customer2 / Customer123!');

    } catch (error) {
        console.error('Error creating sample users:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the script
const main = async () => {
    const args = process.argv.slice(2);
    
    if (args.includes('--admin-only')) {
        await createInitialAdmin();
    } else if (args.includes('--sample-users')) {
        await createSampleUsers();
    } else {
        console.log('Creating initial administrator...');
        await createInitialAdmin();
        console.log('\nCreating sample users...');
        await createSampleUsers();
    }
};

main(); 