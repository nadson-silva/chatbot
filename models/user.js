import mongoose from 'mongoose';


const UserSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true, versionKey: false });



export const User = mongoose.model('user', UserSchema);
// export default User;
// module.exports = User;