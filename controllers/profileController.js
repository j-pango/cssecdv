import UserSchema from './../schemas/UserSchema.js';
import OrderSchema from '../schemas/OrderSchema.js';
import mongoose from 'mongoose';
import { requireRoleA, requireRoleB } from '../middleware/auth.js';

const profileController = {
    getProfile: async (req, res) => {
        console.log('getProfile() called');
        try {
            if (!req.session.user) {
                return res.status(401).redirect('/login');
            }
            const userId = req.session.user._id;
            const user = await UserSchema.findById(userId);
            const userRole = user.role;
            
            console.log('User ID from session:', userId);
            console.log('User Role:', userRole);

            let orders;

            if (userRole === 'Administrator' || userRole === 'Role A') {
                // Administrators can see all orders
                orders = await OrderSchema.find({ status: { $ne: 'Delivered' } })
                    .populate('shipping')
                    .populate('userId', 'username role');
            // } else if (userRole === 'Role A') {
            //     // Role A managers can see orders from their managed users and their own scope
            //     const managedUsers = await UserSchema.find({ createdBy: userId }, '_id');
            //     const managedUserIds = managedUsers.map(user => user._id);
                
            //     orders = await OrderSchema.find({
            //         $or: [
            //             { userId: { $in: managedUserIds } },
            //             { userId: userId }
            //         ],
            //         status: { $ne: 'Delivered' }
            //     }).populate('shipping').populate('userId', 'username role');
            } else {
                // Role B users can only see their own orders
                orders = await OrderSchema.find({ userId })
                    .populate('shipping');
            }

            console.log('Orders:', orders);

            res.status(200).render('profile', {
                user: user,
                orders,
                userRole: user.role
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    cancelOrder: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.status(401).redirect('/login');
            }

            const { orderId } = req.body;  
            const userId = req.session.user._id;
            const userRole = req.session.user.role;

            let order;
            
            if (userRole === 'Administrator' || userRole === 'Role A') {
                // Administrators can cancel any order
                order = await OrderSchema.findById(orderId);
            // } else if (userRole === 'Role A') {
            //     // Role A managers can cancel orders from their managed users
            //     const managedUsers = await UserSchema.find({ createdBy: userId }, '_id');
            //     const managedUserIds = managedUsers.map(user => user._id);
                
            //     order = await OrderSchema.findOne({
            //         _id: orderId,
            //         userId: { $in: [...managedUserIds, userId] },
            //         status: 'Pending'
            //     });
            // } else {
                // Role B users can only cancel their own orders
                order = await OrderSchema.findOne({
                    _id: orderId,
                    userId: userId,
                    status: 'Pending'
                });
            }

            if (!order) {
                return res.status(404).json({ message: 'Order not found or cannot be cancelled' });
            }

            await OrderSchema.deleteOne({ _id: orderId });

            await UserSchema.updateOne(
                { _id: order.userId },
                { $pull: { orderIds: new mongoose.Types.ObjectId(orderId) } }  
            );

            res.redirect('/profile');
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    changeOrderStatus: async (req, res) => {
        try {
            if (!req.session.user) {
                return res.status(401).redirect('/login');
            }
            const { orderId, status } = req.body;
            const userId = req.session.user._id;
            const userRole = req.session.user.role;

            let order;

            if (userRole === 'Administrator' || userRole === 'Role A') {
                // Administrators can change any order status
                order = await OrderSchema.findById(orderId);
            // } else if (userRole === 'Role A') {
            //     // Role A managers can change status of orders from their managed users
            //     const managedUsers = await UserSchema.find({ createdBy: userId }, '_id');
            //     const managedUserIds = managedUsers.map(user => user._id);
                
            //     order = await OrderSchema.findOne({
            //         _id: orderId,
            //         userId: { $in: [...managedUserIds, userId] }
            //     });
            } else {
                // Role B users can only change their own order status
                order = await OrderSchema.findOne({ _id: orderId, userId });
            }

            if (!order) {
                return res.status(404).json({ message: 'Order not found or you do not have permission to update this order.' });
            }

            order.status = status;
            await order.save();

            res.redirect('/profile');  
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },
    
};

export default profileController;
