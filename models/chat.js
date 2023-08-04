import mongoose from 'mongoose';


const ChatSchema = new mongoose.Schema({
    // token: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },
    user: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
    },
    conversation: {
        type: Array,
        required: true
    }
}, { timestamps: true, versionKey: false });

export const ChatModel = mongoose.model('chat', ChatSchema)
